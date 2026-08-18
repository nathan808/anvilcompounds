<?php
/**
 * Deduct stock only once an order reaches "Processing" (payment confirmed),
 * never when it's merely placed on-hold.
 *
 * Why this is needed: this store's checkout (app/api/checkout/place-order)
 * creates every order directly with status "on-hold" — there is no card
 * processor, payment is manual (Zelle/CashApp/ACH/crypto) and settled
 * offline. Orders never pass through WooCommerce's "pending" status first.
 *
 * WooCommerce core reduces stock via wc_maybe_reduce_stock_levels(), which
 * by default is wired to these transitions:
 *   pending -> processing, pending -> completed, pending -> on-hold,
 *   checkout-draft -> processing, checkout-draft -> completed, checkout-draft -> on-hold
 * A brand-new order's in-memory status defaults to "pending" until you
 * explicitly set it, so creating an order with status: "on-hold" via the
 * REST API still fires the "pending -> on-hold" transition internally —
 * which means stock is reduced the instant the order is placed, before any
 * payment has actually been confirmed. There is deliberately NO default
 * "on-hold -> processing" hook, so once Ken later marks an order Processing
 * by hand, nothing reduces stock a second time either.
 *
 * This snippet:
 * 1. Removes the two hooks that reduce stock on arrival at on-hold.
 * 2. Adds explicit hooks so stock reduces the moment an order moves
 *    on-hold -> processing (the normal path here) or on-hold -> completed
 *    (in case an order is ever marked complete without passing through
 *    processing first).
 *
 * Safe to install at any time — WooCommerce's own _reduced_stock order meta
 * flag prevents double-reduction, so this can't cause an order to be
 * deducted twice even if hooks briefly overlap.
 *
 * Setup: paste into Code Snippets (Snippets -> Add New), run everywhere,
 * activate. No secrets, no config values to fill in.
 *
 * To verify after installing: place a real (or test) order, confirm the
 * product's stock number does NOT drop while it's on-hold, then mark the
 * order Processing in WP admin and confirm it drops by the ordered quantity
 * exactly once.
 */

add_action('init', function () {
    remove_action('woocommerce_order_status_pending_to_on-hold', 'wc_maybe_reduce_stock_levels');
    remove_action('woocommerce_order_status_checkout_draft_to_on-hold', 'wc_maybe_reduce_stock_levels');

    add_action('woocommerce_order_status_on-hold_to_processing', 'wc_maybe_reduce_stock_levels');
    add_action('woocommerce_order_status_on-hold_to_completed', 'wc_maybe_reduce_stock_levels');
}, 20);
