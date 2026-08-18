<?php
/**
 * Full unpaid-order lifecycle for orders placed on-hold (manual payment —
 * see stock-reduce-on-processing.php for the related stock-timing fix).
 *
 * REPLACES the old single-reminder version of this same snippet. This is a
 * full rewrite, not an addition — if the old file is already pasted into
 * Code Snippets and active, edit that existing snippet in place and paste
 * this whole file over it. Do NOT create a second, separate snippet, or
 * orders will get duplicate/conflicting reminders.
 *
 * Sequence, all timed from order creation, each one independently
 * re-checking the order is still on-hold before doing anything (so a
 * customer who pays at hour 30 never gets the 48hr or 86hr steps):
 *
 *   t+0    "Thank You for Your Research Inquiry!" — welcome + order recap.
 *          REPLACES WooCommerce's default On-hold customer email — go to
 *          WooCommerce -> Settings -> Emails -> On-hold and uncheck
 *          "Enable this email notification", or the customer gets two
 *          emails at once. (This does NOT touch the separate admin-only
 *          "New order" notification that emails you, not the customer.)
 *   t+24h  Unpaid Reminder 1 — "awaiting payment", full process recap.
 *   t+48h  Unpaid Reminder 2 — "still holding your items", troubleshooting.
 *   t+86h  Unpaid — Released — sends the email AND actually cancels the
 *          order (wc order status -> cancelled) at the same time, so the
 *          copy ("we released your order") is literally true and the hold
 *          is freed. WooCommerce's own stock-restore logic is a safe no-op
 *          here since stock-reduce-on-processing.php already guarantees
 *          nothing was ever deducted while the order sat on-hold.
 *
 * All four emails render the same order-recap table using WooCommerce's
 * own core template (emails/email-order-details.php) rather than hand-built
 * HTML, so it's pixel-identical to the tables already in your native
 * Processing/Shipped emails.
 *
 * KNOWN GAP: orders already sitting on-hold at the moment this is installed
 * won't pick up the new 24/48/86h schedule (that only gets set up once, on
 * woocommerce_new_order, when the order is first created) — this only
 * governs orders placed after install.
 *
 * Setup:
 * 1. Paste into Code Snippets (replacing the old version), run everywhere,
 *    activate.
 * 2. Disable the default On-hold customer email (see above).
 * 3. Confirm all four new emails are enabled under WooCommerce -> Settings
 *    -> Emails: "Thank You (Order Confirmation)", "Unpaid Reminder 1
 *    (24hr)", "Unpaid Reminder 2 (48hr)", "Unpaid — Released (86hr)" (all
 *    default to enabled).
 *
 * WP-Cron caveat (same as before): fires on site traffic, not a wall
 * clock, so on a slow night these can run a bit late.
 */

// ─── 1. Schedule everything the moment an order is created on-hold ────────

add_action('woocommerce_new_order', function ($order_id, $order = null) {
    if (!$order) {
        $order = wc_get_order($order_id);
    }
    if (!$order || $order->get_status() !== 'on-hold') {
        return;
    }
    if ($order->get_meta('_anvil_lifecycle_scheduled') === 'yes') {
        return;
    }
    $order->update_meta_data('_anvil_lifecycle_scheduled', 'yes');
    $order->save();

    // t+0 — sent immediately, not scheduled.
    anvil_send_lifecycle_email('Anvil_Thank_You_Email', $order_id, $order);

    wp_schedule_single_event(time() + DAY_IN_SECONDS, 'anvil_send_unpaid_reminder_1', [$order_id]);
    wp_schedule_single_event(time() + 2 * DAY_IN_SECONDS, 'anvil_send_unpaid_reminder_2', [$order_id]);
    wp_schedule_single_event(time() + 86 * HOUR_IN_SECONDS, 'anvil_expire_unpaid_order', [$order_id]);
}, 10, 2);

add_action('anvil_send_unpaid_reminder_1', function ($order_id) {
    anvil_send_lifecycle_email('Anvil_Unpaid_Reminder_1_Email', $order_id);
});

add_action('anvil_send_unpaid_reminder_2', function ($order_id) {
    anvil_send_lifecycle_email('Anvil_Unpaid_Reminder_2_Email', $order_id);
});

add_action('anvil_expire_unpaid_order', function ($order_id) {
    $order = wc_get_order($order_id);
    if (!$order || $order->get_status() !== 'on-hold') {
        return; // paid or already cancelled in the meantime — leave it alone
    }
    anvil_send_lifecycle_email('Anvil_Unpaid_Released_Email', $order_id, $order);
    $order->update_status('cancelled', 'Anvil: auto-cancelled — unpaid 86 hours after order placed.');
});

function anvil_send_lifecycle_email($class_name, $order_id, $order = null) {
    if (!$order) {
        $order = wc_get_order($order_id);
    }
    if (!$order || $order->get_status() !== 'on-hold') {
        return; // paid/cancelled since this was scheduled — say nothing
    }
    WC()->mailer(); // load WC_Emails so the classes below are registered
    $email = WC()->mailer()->get_emails()[$class_name] ?? null;
    if ($email) {
        $email->trigger($order_id, $order);
    }
}

// ─── 2. Shared order-recap table — WooCommerce's own core template, so it
//        matches your native Processing/Shipped emails exactly ────────────

function anvil_order_recap_table($order, $email) {
    return wc_get_template_html('emails/email-order-details.php', [
        'order'         => $order,
        'sent_to_admin' => false,
        'plain_text'    => false,
        'email'         => $email,
    ]);
}

// ─── 3. The four email classes ─────────────────────────────────────────────

add_filter('woocommerce_email_classes', function ($email_classes) {
    if (!class_exists('WC_Email')) {
        return $email_classes;
    }

    class Anvil_Thank_You_Email extends WC_Email {
        public function __construct() {
            $this->id             = 'anvil_thank_you';
            $this->title          = 'Thank You (Order Confirmation)';
            $this->description    = 'Sent immediately when an order is placed — replaces the default On-hold customer email.';
            $this->customer_email = true;
            $this->heading        = 'Thank you for your research inquiry';
            $this->subject        = 'Thank You for Your Research Inquiry! — Order #{order_number} received';
            parent::__construct();
        }
        public function trigger($order_id, $order = false) {
            $this->object = $order ?: wc_get_order($order_id);
            if (!$this->object) return;
            $this->recipient = $this->object->get_billing_email();
            if (!$this->is_enabled() || !$this->get_recipient()) return;
            $this->send($this->get_recipient(), $this->get_subject(), $this->get_content(), $this->get_headers(), $this->get_attachments());
        }
        public function get_content_html() {
            $o = $this->object;
            $first_name = esc_html($o->get_billing_first_name());
            ob_start();
            ?>
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
              <p>Hi <?php echo $first_name; ?>,</p>
              <p>Thanks for placing an order with Anvil Compounds. Nothing has been charged yet — here's what happens next:</p>
              <ol>
                <li>Your order is held for you — nothing charged</li>
                <li>A secure payment link arrives by email within 15 minutes</li>
                <li>Pay With Credit Card Via Invoice, Zelle, or crypto — ships same or next business day after payment clears</li>
              </ol>
              <p>Here's what you ordered:</p>
              <?php echo anvil_order_recap_table($o, $this); ?>
              <p>Every lot ships with independent third-party testing (HPLC + Mass Spectrometry + Endotoxin screening) — your COA verification code arrives with your shipment.</p>
              <p>Your items are held for 72 hours. If anything about the payment step gives you pause, just reply to this email — a person answers.</p>
              <p>Questions: <a href="mailto:support@anvilcompounds.shop">support@anvilcompounds.shop</a></p>
            </div>
            <?php
            return ob_get_clean();
        }
    }

    class Anvil_Unpaid_Reminder_1_Email extends WC_Email {
        public function __construct() {
            $this->id             = 'anvil_unpaid_reminder_1';
            $this->title          = 'Unpaid Reminder 1 (24hr)';
            $this->description    = 'Sent 24 hours after order placement, only if still on-hold (unpaid).';
            $this->customer_email = true;
            $this->heading        = 'Your order is awaiting payment';
            $this->subject        = 'Order #{order_number} is placed. Nothing has been charged.';
            parent::__construct();
        }
        public function trigger($order_id, $order = false) {
            $this->object = $order ?: wc_get_order($order_id);
            if (!$this->object) return;
            $this->recipient = $this->object->get_billing_email();
            if (!$this->is_enabled() || !$this->get_recipient()) return;
            $this->send($this->get_recipient(), $this->get_subject(), $this->get_content(), $this->get_headers(), $this->get_attachments());
        }
        public function get_content_html() {
            $o = $this->object;
            $first_name = esc_html($o->get_billing_first_name());
            $order_number = esc_html($o->get_order_number());
            ob_start();
            ?>
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
              <p><strong>Order #<?php echo $order_number; ?> is placed. Nothing has been charged.</strong></p>
              <p>Your order is awaiting payment</p>
              <p>Hi <?php echo $first_name; ?>!</p>
              <p>You've got an order set up with us but haven't completed it yet.</p>
              <p>If the payment step gave you pause, here's the whole process:</p>
              <ol>
                <li>Place your order — Nothing charged</li>
                <li>Check your email — Secure link, 15 minutes</li>
                <li>Pay With Credit Card Via Invoice — Ships same or next business day</li>
              </ol>
              <p>Card details are entered on our processing link. If you'd rather, our Zelle and crypto options are also available at checkout.</p>
              <p><strong>Here's a code: chk10</strong> — 10% off this order: apply at checkout to re-order your items with a complementary discount</p>
              <p>Here's a reminder of what you've ordered:</p>
              <?php echo anvil_order_recap_table($o, $this); ?>
              <p>Your items are held for another 48 hours. We ship the same or next business day after payment clears.</p>
              <p>Questions: <a href="mailto:support@anvilcompounds.shop">support@anvilcompounds.shop</a></p>
            </div>
            <?php
            return ob_get_clean();
        }
    }

    class Anvil_Unpaid_Reminder_2_Email extends WC_Email {
        public function __construct() {
            $this->id             = 'anvil_unpaid_reminder_2';
            $this->title          = 'Unpaid Reminder 2 (48hr)';
            $this->description    = 'Sent 48 hours after order placement, only if still on-hold (unpaid).';
            $this->customer_email = true;
            $this->heading        = 'Still holding your items';
            $this->subject        = 'Still holding your items — order #{order_number}';
            parent::__construct();
        }
        public function trigger($order_id, $order = false) {
            $this->object = $order ?: wc_get_order($order_id);
            if (!$this->object) return;
            $this->recipient = $this->object->get_billing_email();
            if (!$this->is_enabled() || !$this->get_recipient()) return;
            $this->send($this->get_recipient(), $this->get_subject(), $this->get_content(), $this->get_headers(), $this->get_attachments());
        }
        public function get_content_html() {
            $o = $this->object;
            $order_number = esc_html($o->get_order_number());
            ob_start();
            ?>
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
              <p>Order #<?php echo $order_number; ?> is still open. Your lots are held.</p>
              <p>If something went wrong, it's usually one of these:</p>
              <table style="width:100%;border-collapse:collapse;margin:12px 0;">
                <tr><td style="padding:6px 0;vertical-align:top;"><strong>Card declined</strong></td><td style="padding:6px 0;">Common on first orders in our category. Try again, or try a different card, or switch to Zelle or crypto.</td></tr>
                <tr><td style="padding:6px 0;vertical-align:top;"><strong>Link didn't arrive</strong></td><td style="padding:6px 0;">Check spam. Add support@anvilcompounds.shop to your contacts and reply; we'll resend.</td></tr>
                <tr><td style="padding:6px 0;vertical-align:top;"><strong>Changed your mind</strong></td><td style="padding:6px 0;">Reply and we'll release it. No follow-up.</td></tr>
              </table>
              <p><strong>Here's a code: chk10</strong> — 10% off this order: apply at checkout to re-order your items with a complementary discount</p>
              <p>Here's a reminder of what you've ordered:</p>
              <?php echo anvil_order_recap_table($o, $this); ?>
              <p>Your items are held for another 24 hours. We ship the same or next business day after payment clears.</p>
              <p>Questions: <a href="mailto:support@anvilcompounds.shop">support@anvilcompounds.shop</a></p>
              <p>Reply to this email and a person answers.</p>
            </div>
            <?php
            return ob_get_clean();
        }
    }

    class Anvil_Unpaid_Released_Email extends WC_Email {
        public function __construct() {
            $this->id             = 'anvil_unpaid_released';
            $this->title          = 'Unpaid — Released (86hr)';
            $this->description    = 'Sent 86 hours after order placement if still unpaid. Also cancels the order and releases the hold at the same time.';
            $this->customer_email = true;
            $this->heading        = 'Your hold has been released';
            $this->subject        = 'Order #{order_number} released — nothing was charged';
            parent::__construct();
        }
        public function trigger($order_id, $order = false) {
            $this->object = $order ?: wc_get_order($order_id);
            if (!$this->object) return;
            $this->recipient = $this->object->get_billing_email();
            if (!$this->is_enabled() || !$this->get_recipient()) return;
            $this->send($this->get_recipient(), $this->get_subject(), $this->get_content(), $this->get_headers(), $this->get_attachments());
        }
        public function get_content_html() {
            $o = $this->object;
            $first_name = esc_html($o->get_billing_first_name());
            ob_start();
            ?>
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
              <p>Hi <?php echo $first_name; ?>,</p>
              <p>Unfortunately, we released your order because we haven't received a payment, or there was an issue with your payment method.</p>
              <p>Nothing was charged. Nothing further is owed.</p>
              <p>If you still want the material, it's in the catalog — same lot while it lasts, and reordering takes about a minute.</p>
              <p>If you'd still like to continue with your purchase, please return to anvilcompounds.shop and try a different method of payment or contact us for a new invoice link: <a href="mailto:support@anvilcompounds.shop">support@anvilcompounds.shop</a>.</p>
              <p>If payment was the obstacle, tell us which part and we'll sort it: <a href="mailto:support@anvilcompounds.shop">support@anvilcompounds.shop</a></p>
            </div>
            <?php
            return ob_get_clean();
        }
    }

    $email_classes['Anvil_Thank_You_Email']         = new Anvil_Thank_You_Email();
    $email_classes['Anvil_Unpaid_Reminder_1_Email'] = new Anvil_Unpaid_Reminder_1_Email();
    $email_classes['Anvil_Unpaid_Reminder_2_Email'] = new Anvil_Unpaid_Reminder_2_Email();
    $email_classes['Anvil_Unpaid_Released_Email']   = new Anvil_Unpaid_Released_Email();
    return $email_classes;
});
