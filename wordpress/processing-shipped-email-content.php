<?php
/**
 * Prepends explanatory copy to the TOP of the existing "Processing" and
 * "Shipped" (WooCommerce's core "Completed" order status, relabeled
 * "Shipped" in wp-admin via Advanced Shipment Tracking) customer emails.
 * Everything below the inserted text — the order items table, and for
 * Shipped, the Advanced Shipment Tracking block — is WooCommerce/AST's own
 * existing output, untouched by this snippet.
 *
 * Subject lines are NOT set here — set them directly in WooCommerce ->
 * Settings -> Emails (plain text fields, no code needed):
 *   Completed order -> Subject: Good things are heading your way! Your order shipped
 *   (Processing order's subject wasn't given new copy, so it's left as-is —
 *   only the body content above the order table changes for that one.)
 *
 * Setup: paste into Code Snippets (Snippets -> Add New), run everywhere,
 * activate.
 *
 * Priority 5 (lower than WooCommerce/AST's typical default of 10) so this
 * text renders ABOVE the order table and AST's tracking block, not below
 * it. Check the actual email after install — if AST still ends up
 * rendering above this text, lower the priority number further (e.g. to 1).
 */

add_action('woocommerce_email_before_order_table', function ($order, $sent_to_admin, $plain_text, $email) {
    if ($sent_to_admin || $plain_text) {
        return;
    }

    if ($email->id === 'customer_processing_order') {
        ?>
        <div style="font-family:sans-serif;">
          <p><strong>Your payment has been received. Here's the rest.</strong></p>
          <p>Your payment cleared, and order #<?php echo esc_html($order->get_order_number()); ?> is in the queue.</p>
          <p><strong>What happens from here:</strong></p>
          <p>Today or the next business day, your order is picked and packed. We ship Monday through Friday from Southern California. Within 24 hours of dispatch, tracking arrives by email. 2-5 business days: typical domestic transit, USPS Priority.</p>
          <p><strong>What's in the package:</strong> each vial in protective, unmarked packaging.</p>
          <p>If the package arrives damaged or you received the wrong items, photograph it and email support@anvilcompounds.shop or contact us directly on our website's "Contact" page within 48 hours. We'll replace it at no cost or offer you a full refund, and we don't need the damaged vial back.</p>
          <p>Here's a reminder of what you've ordered:</p>
        </div>
        <?php
    }

    if ($email->id === 'customer_completed_order') {
        ?>
        <div style="font-family:sans-serif;">
          <p>Tracking inside, plus the short version of how your lot was verified.</p>
          <p><strong>What was run on your lot.</strong></p>
          <p>Before the material in this box went into stock, it went through three separate analyses at Freedom Diagnostics. Here is what each one answered, in plain terms.</p>
          <p><strong>HPLC</strong> measured how much of the sample is a single substance. That's the purity figure on your certificate.</p>
          <p><strong>Mass spectrometry</strong> confirmed that the substance is the one named on the label. Purity without identity is a number about an unknown.</p>
          <p><strong>Endotoxin screening (LAL)</strong> checked for bacterial contamination carried through from synthesis or equipment. Neither of the other two tests reaches it.</p>
          <p>Your batch's COA verification code is on the vial, which leads to our COA catalog.</p>
        </div>
        <?php
    }
}, 5, 4);
