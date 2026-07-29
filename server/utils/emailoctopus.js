// Shared EmailOctopus helper — used by contact route and admin route
const EO_BASE = 'https://emailoctopus.com/api/1.6';

/**
 * Subscribe a contact to an EmailOctopus list.
 * Silently no-ops if not configured or already subscribed.
 */
async function subscribeContact(db, { email, firstName, lastName, tags = ['website-enquiry'] }) {
  const rows = db.prepare(
    "SELECT key, value FROM site_settings WHERE key LIKE 'emailoctopus_%'"
  ).all();
  const s = Object.fromEntries(rows.map(r => [r.key, r.value]));

  if (s.emailoctopus_enabled !== '1') return;
  if (!s.emailoctopus_api_key || !s.emailoctopus_list_id) return;

  try {
    const res = await fetch(`${EO_BASE}/lists/${s.emailoctopus_list_id}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key:       s.emailoctopus_api_key,
        email_address: email,
        fields: {
          ...(firstName ? { FirstName: firstName } : {}),
          ...(lastName  ? { LastName:  lastName  } : {}),
        },
        tags,
        status: 'SUBSCRIBED',
      }),
    });
    const data = await res.json();
    // MEMBER_EXISTS is not a real error — ignore it
    if (data.error && data.error.code !== 'MEMBER_EXISTS_WITH_EMAIL_ADDRESS') {
      console.warn('EmailOctopus subscribe error:', data.error);
    }
  } catch (err) {
    // Never let EO failure break the contact form
    console.warn('EmailOctopus fetch failed:', err.message);
  }
}

/**
 * Fetch all lists from EmailOctopus for the given API key.
 */
async function fetchLists(apiKey) {
  const res = await fetch(`${EO_BASE}/lists?api_key=${encodeURIComponent(apiKey)}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || data.error.code || 'EmailOctopus error');
  return data.data || [];
}

module.exports = { subscribeContact, fetchLists };
