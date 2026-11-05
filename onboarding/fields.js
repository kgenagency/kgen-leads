// Single source of truth for the onboarding form. Used by index.html (client) and admin.html (team).
// type: text | email | tel | url | textarea | select | radio | checks | rank | access | offers | zones
window.KGEN_FORM = [
  { id: 'business', title: 'Business Info', sub: 'The basics about you and your shop.', fields: [
    { k: 'first_name', label: 'First Name', type: 'text', req: true, half: true },
    { k: 'last_name', label: 'Last Name', type: 'text', req: true, half: true },
    { k: 'business_name', label: 'Business Name', type: 'text', req: true },
    { k: 'business_email', label: 'Business Email', type: 'email', req: true, half: true },
    { k: 'business_phone', label: 'Business Phone', type: 'tel', req: true, half: true },
    { k: 'hours', label: 'Hours of Operation', type: 'textarea', ph: 'Mon to Fri 8am to 6pm, Sat 9am to 2pm', rows: 2 },
    { k: 'address_type', label: 'Is the address below your business or your home address?', type: 'radio', opts: ['Business address', 'Home address'] },
    { k: 'address', label: 'Address', type: 'text', ph: 'Street, City, State/Province, ZIP' },
    { k: 'time_zone', label: 'Time Zone', type: 'select', opts: ['Eastern (ET)', 'Central (CT)', 'Mountain (MT)', 'Pacific (PT)', 'Alaska (AKT)', 'Hawaii (HT)', 'Atlantic (AT)', 'Newfoundland (NT)', 'UK (GMT/BST)', 'Other'] },
    { k: 'operation_type', label: 'Are you mobile, do you have a shop location, or both?', type: 'radio', opts: ['Mobile', 'Shop location', 'Both'] },
  ]},
  { id: 'links', title: 'Business Links', sub: 'Where your customers find you today.', fields: [
    { k: 'website', label: 'Business Website URL', type: 'url', ph: 'https://' },
    { k: 'facebook', label: 'Business Facebook Page URL', type: 'url', ph: 'https://facebook.com/' },
    { k: 'instagram', label: 'Instagram Page URL', type: 'url', ph: 'https://instagram.com/' },
  ]},
  { id: 'crm', title: 'CRM Setup', sub: 'Who gets notified when a new lead comes in.', fields: [
    { k: 'email_notify', label: 'Email Notification List (names + emails)', type: 'textarea', ph: 'John Smith, john@shop.com', rows: 3 },
    { k: 'sms_notify', label: 'Text Message Notification List (names + phone numbers)', type: 'textarea', ph: 'John Smith, +1 555 123 4567', rows: 3 },
    { k: 'lead_platform', label: 'Do you use Urable or a different platform to keep track of leads?', type: 'text', ph: 'Urable / Jobber / spreadsheet / nothing yet' },
    { k: 'legal_name', label: 'Legal Business Name', type: 'text', hint: 'Needed to register your business for SMS texting (A2P compliance).' },
    { k: 'legal_address', label: 'Legal Business Address', type: 'text' },
    { k: 'ein', label: 'Business tax ID (EIN)', type: 'text', ph: 'XX-XXXXXXX', hint: 'US: EIN. Canada: Business Number (BN). UK: Company Number.' },
  ]},
  { id: 'ads', title: 'Ad Setup', sub: 'What we will put in front of your market.', fields: [
    { k: 'common_vehicles', label: 'What vehicles are most common in your area?', type: 'textarea', ph: 'Trucks, Teslas, Jeeps, luxury SUVs...', rows: 2 },
    { k: 'services', label: 'Which services do you want to advertise? Tap them in order of priority, most important first.', type: 'pickrank', req: true,
      opts: ['Ceramic Coating', 'Paint Protection Film (PPF)', 'Window Tint', 'Paint Correction', 'Full Detail', 'Interior Detailing', 'Exterior Detailing', 'Maintenance Wash', 'Vinyl Wrap', 'Headlight Restoration', 'Windshield Protection', 'Wheel & Caliper Coating', 'Boat / RV Detailing', 'Fleet Detailing'],
      hint: 'The number on each service is its priority. Tap a service again to remove it.' },
    { k: 'packages_link', label: 'Link to your Urable store or website with all package details', type: 'url', ph: 'https://' },
    { k: 'coating_brand', label: 'What ceramic coating brand do you use?', type: 'text', ph: 'Leave blank if you do not offer it', half: true },
    { k: 'coating_start_price', label: 'Starting price of your lowest coating offer', type: 'text', ph: '$799', half: true },
    { k: 'ppf_brand', label: 'What PPF brand do you use?', type: 'text', ph: 'Leave blank if you do not offer it', half: true },
    { k: 'tint_brand', label: 'What tint brand do you use?', type: 'text', ph: 'Leave blank if you do not offer it', half: true },
    { k: 'assets_folder', label: 'Digital assets folder (logos, photos, videos)', type: 'url', ph: 'Google Drive / Dropbox link', hint: 'Make sure the link is set to "Anyone with the link can view".' },
  ]},
  { id: 'offers', title: 'Budget & Offers', sub: 'How much we spend and what we lead with.', fields: [
    { k: 'ad_budget', label: 'Monthly ad spend budget', type: 'text', ph: '$1,500', half: true },
    { k: 'platforms', label: 'Where should your ads run?', type: 'checks', opts: ['Facebook', 'Instagram'], half: true },
    { k: 'offers', label: 'Offer per service', type: 'offers', from: 'services', hint: 'A promo, bonus, or price you want to lead with for each service. Leave blank if unsure and we will build one together.' },
  ]},
  { id: 'access', title: 'Platform Access', sub: 'Tell us where you stand on each account.', fields: [
    { k: 'access', label: 'Platform access', type: 'access', rows: ['Facebook / Meta Ads', 'Google Business Profile', 'Google Analytics 4', 'Slack', 'GoHighLevel (GHL)'], statuses: ['Access granted', 'Will grant', 'Need help', "Don't have it"] },
  ]},
  { id: 'geo', title: 'Service Area', sub: 'Where your customers are, and where they are not.', fields: [
    { k: 'zones_include', label: 'Areas to target', type: 'zones', hint: 'City + how far you are willing to drive or how far customers travel to you.' },
    { k: 'zones_exclude', label: 'Areas to exclude (optional)', type: 'textarea', ph: 'Neighborhoods or towns you do not want leads from', rows: 2 },
  ]},
  { id: 'goals', title: 'Business Goals', sub: 'Kept private. Used only to set targets for your account.', fields: [
    { k: 'gross_margin', label: 'Gross margin rate across all services', type: 'text', ph: '60%', half: true },
    { k: 'avg_revenue', label: 'Average monthly revenue currently', type: 'text', ph: '$', half: true },
    { k: 'revenue_goal', label: 'Monthly revenue goal 6 months from now', type: 'text', ph: '$' },
  ]},
  { id: 'personal', title: 'Personal Info', sub: 'For anything we send you by mail.', fields: [
    { k: 'mailing_address', label: 'Good mailing address for you', type: 'text' },
    { k: 'home_address', label: 'Home address (if different)', type: 'text' },
    { k: 'notes', label: 'Anything else we should know?', type: 'textarea', rows: 3 },
  ]},
];
