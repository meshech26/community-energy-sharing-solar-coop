async function testApi() {
  const baseUrl = 'http://127.0.0.1:5000/api/energy';

  console.log('--- TEST 1: Kavindi Perera calls /listings (buying section) ---');
  try {
    const res = await fetch(`${baseUrl}/listings`, {
      headers: {
        'x-user-email': 'user@solarcoop.com',
        'x-user-name': 'Kavindi Perera',
        'x-user-role': 'normal'
      }
    });
    const data = await res.json();
    console.log(`Received ${data.data.length} listings for Kavindi:`);
    data.data.forEach(l => {
      console.log(`  - Listing ID: ${l._id}, Seller: ${l.sellerId?.name} (${l.sellerId?.email}), Qty: ${l.approvedQuantity} kWh, Price: ${l.approvedUnitPrice}`);
    });
    
    // Check that none belong to Kavindi
    const hasKavindiListing = data.data.some(l => l.sellerId?.email === 'user@solarcoop.com' || l.sellerId?.name === 'Kavindi Perera');
    console.log('PASSED: Kavindi does NOT see own listings:', !hasKavindiListing);
  } catch (e) {
    console.error('Kavindi request failed:', e.message);
  }

  console.log('\n--- TEST 2: Sunil Fernando calls /listings (buying section) ---');
  try {
    const res = await fetch(`${baseUrl}/listings`, {
      headers: {
        'x-user-email': 'sunil@solarcoop.com',
        'x-user-name': 'Sunil Fernando',
        'x-user-role': 'normal'
      }
    });
    const data = await res.json();
    console.log(`Received ${data.data.length} listings for Sunil:`);
    data.data.forEach(l => {
      console.log(`  - Listing ID: ${l._id}, Seller: ${l.sellerId?.name} (${l.sellerId?.email}), Qty: ${l.approvedQuantity} kWh, Price: ${l.approvedUnitPrice}`);
    });

    // Check that none belong to Sunil
    const hasSunilListing = data.data.some(l => l.sellerId?.email === 'sunil@solarcoop.com' || l.sellerId?.name === 'Sunil Fernando');
    console.log('PASSED: Sunil does NOT see own listings:', !hasSunilListing);

    // Check that Kavindi's listings ARE visible to Sunil
    const hasKavindiListingForSunil = data.data.some(l => l.sellerId?.email === 'user@solarcoop.com' || l.sellerId?.name === 'Kavindi Perera');
    console.log('PASSED: Sunil sees Kavindi listings with name "Kavindi Perera":', hasKavindiListingForSunil);
  } catch (e) {
    console.error('Sunil request failed:', e.message);
  }

  console.log('\n--- TEST 3: Kavindi Perera calls /listings/my (My Listings) ---');
  try {
    const res = await fetch(`${baseUrl}/listings/my`, {
      headers: {
        'x-user-email': 'user@solarcoop.com',
        'x-user-name': 'Kavindi Perera',
        'x-user-role': 'normal'
      }
    });
    const data = await res.json();
    console.log(`Received ${data.data.length} listings in My Listings for Kavindi:`);
    data.data.slice(0, 3).forEach(l => {
      console.log(`  - Listing ID: ${l._id}, Status: ${l.status}, Qty: ${l.pendingQuantity || l.approvedQuantity}`);
    });
    console.log('PASSED: My Listings works properly:', data.data.length > 0);
  } catch (e) {
    console.error('My listings request failed:', e.message);
  }
}

testApi();
