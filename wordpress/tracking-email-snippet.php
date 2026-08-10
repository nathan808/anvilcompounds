<?php
/**
 * Add tracking number + USPS link to the WooCommerce "Completed order"
 * customer email, when Ken has set the `tracking_number` order meta
 * (optionally `tracking_carrier`, defaults to USPS) — same unprefixed meta
 * keys the Next.js account/tracking pages read, entered by hand via the
 * order's default WP admin "Custom Fields" box.
 *
 * Paste into the Code Snippets plugin (Snippets → Add New), set to run
 * "Everywhere", and activate. HTML emails only — WooCommerce's default
 * customer emails are HTML, so this only has a no-op fallback for the rare
 * plain-text case rather than a full plain-text rendering.
 */

add_action( 'woocommerce_email_after_order_table', 'anvil_add_tracking_to_completed_email', 10, 4 );

function anvil_add_tracking_to_completed_email( $order, $sent_to_admin, $plain_text, $email ) {
	if ( $sent_to_admin || $plain_text || ! $email || 'customer_completed_order' !== $email->id ) {
		return;
	}

	$tracking_number = $order->get_meta( 'tracking_number' );
	if ( ! $tracking_number ) {
		return;
	}

	$carrier = $order->get_meta( 'tracking_carrier' );
	if ( ! $carrier ) {
		$carrier = 'USPS';
	}

	$tracking_url = ( 'USPS' === strtoupper( $carrier ) )
		? 'https://tools.usps.com/go/TrackConfirmAction?tLabels=' . rawurlencode( $tracking_number )
		: '';

	echo '<h2>Tracking</h2>';
	echo '<p style="margin:0 0 16px;">';
	echo esc_html( $carrier ) . ' tracking number: <strong>' . esc_html( $tracking_number ) . '</strong>';
	if ( $tracking_url ) {
		echo '<br /><a href="' . esc_url( $tracking_url ) . '">Track this package →</a>';
	}
	echo '</p>';
}
