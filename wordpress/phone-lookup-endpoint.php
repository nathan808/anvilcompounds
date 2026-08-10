<?php
/**
 * Exposes a lightweight "find customer by phone" endpoint the Next.js app
 * uses for phone-based sign-in (see lib/wcAuth.ts findWcCustomerByPhone).
 *
 * WooCommerce's REST /customers?search= filters by name/email/username —
 * NOT phone (billing_phone is plain, unindexed user meta) — so phone login
 * needs this instead of a slow full-customer-list scan.
 *
 * Setup:
 * 1. Paste into the Code Snippets plugin (Snippets → Add New), run "Only
 *    admin area" is fine since it's only ever called server-to-server.
 * 2. Replace ANVIL_PHONE_LOOKUP_SECRET_VALUE below with a long random
 *    string (e.g. `openssl rand -hex 32`).
 * 3. Set the exact same string as the ANVIL_PHONE_LOOKUP_SECRET env var in
 *    Vercel. Anyone who has this value can look up (not modify) a customer
 *    ID by phone number, so treat it like the other shared secrets already
 *    in this app (ANVIL_AUTH_SECRET, GATE_SECRET).
 */

if (!defined('ANVIL_PHONE_LOOKUP_SECRET_VALUE')) {
	define('ANVIL_PHONE_LOOKUP_SECRET_VALUE', 'replace-with-a-long-random-string');
}

add_action('rest_api_init', function () {
	register_rest_route('anvil/v1', '/customer-by-phone', [
		'methods'             => 'GET',
		'callback'            => 'anvil_customer_by_phone',
		'permission_callback' => function (WP_REST_Request $request) {
			$provided = (string) $request->get_header('x-anvil-secret');
			return $provided && hash_equals(ANVIL_PHONE_LOOKUP_SECRET_VALUE, $provided);
		},
	]);
});

function anvil_customer_by_phone(WP_REST_Request $request) {
	$phone = preg_replace('/\D/', '', (string) $request->get_param('phone'));
	if (!$phone) {
		return new WP_REST_Response(['id' => null], 200);
	}

	global $wpdb;
	// LIKE match against the digit-stripped end of stored numbers, since
	// billing_phone may be saved as "(619) 555-1234" or "+16195551234"
	// depending on how the customer/Ken entered it.
	$user_ids = $wpdb->get_col($wpdb->prepare(
		"SELECT user_id FROM {$wpdb->usermeta}
		 WHERE meta_key = 'billing_phone'
		 AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(meta_value,'-',''),' ',''),'(',''),')',''),'+','') LIKE %s
		 LIMIT 5",
		'%' . $wpdb->esc_like($phone) . '%'
	));

	return new WP_REST_Response(['id' => $user_ids ? (int) $user_ids[0] : null], 200);
}
