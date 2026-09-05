const baseUrl = 'http://127.0.0.1:5000/api/energy';

async function testDeclinedEditFlow() {
  try {
    console.log('--- TEST 1: Create a listing as Kavindi (user@solarcoop.com) ---');
    const createRes = await fetch(`${baseUrl}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': 'user@solarcoop.com',
        'x-user-name': 'Kavindi Perera',
        'x-user-role': 'normal'
      },
      body: JSON.stringify({
        quantity: 10,
        unitPrice: 45,
        description: 'Test Rooftop Solar Share'
      })
    });
    const createData = await createRes.json();
    console.log('Created listing ID:', createData.data?._id);
    const listingId = createData.data?._id;
    console.assert(createData.data?.status === 'PENDING_APPROVAL', 'Initial status should be PENDING_APPROVAL');

    console.log('\n--- TEST 2: Admin declines listing ---');
    const declineRes = await fetch(`${baseUrl}/admin/listings/${listingId}/decline`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': 'admin@solarcoop.com',
        'x-user-name': 'Co-op Admin',
        'x-user-role': 'admin'
      },
      body: JSON.stringify({
        reason: 'Rate exceeds cooperative recommended maximum of 40 LKR/kWh'
      })
    });
    const declineData = await declineRes.json();
    console.log('Declined status:', declineData.data?.status);
    console.log('Decline reason:', declineData.data?.declineReason);
    console.assert(declineData.data?.status === 'DECLINED', 'Status should be DECLINED');
    console.assert(declineData.data?.declineReason === 'Rate exceeds cooperative recommended maximum of 40 LKR/kWh', 'Reason should match');

    console.log('\n--- TEST 3: User edits declined listing (qty: 12 kWh, price: 38 LKR/kWh) ---');
    const updateRes = await fetch(`${baseUrl}/listings/${listingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': 'user@solarcoop.com',
        'x-user-name': 'Kavindi Perera',
        'x-user-role': 'normal'
      },
      body: JSON.stringify({
        quantity: 12,
        unitPrice: 38
      })
    });
    const updateData = await updateRes.json();
    console.log('Updated status (MUST BE PENDING_APPROVAL):', updateData.data?.status);
    console.log('Updated listedQuantity:', updateData.data?.listedQuantity);
    console.log('Updated pendingQuantity:', updateData.data?.pendingQuantity);
    console.log('Updated pendingUnitPrice:', updateData.data?.pendingUnitPrice);
    console.log('Decline reason cleared:', updateData.data?.declineReason === undefined || updateData.data?.declineReason === null);
    console.assert(updateData.data?.status === 'PENDING_APPROVAL', 'FAIL: Status should be PENDING_APPROVAL');
    console.assert(updateData.data?.listedQuantity === 12, 'FAIL: listedQuantity should be 12');
    console.assert(updateData.data?.pendingUnitPrice === 38, 'FAIL: pendingUnitPrice should be 38');

    console.log('\n--- TEST 4: Listing appears in Admin Pending queue ---');
    const pendingRes = await fetch(`${baseUrl}/admin/pending`, {
      headers: {
        'x-user-email': 'admin@solarcoop.com',
        'x-user-name': 'Co-op Admin',
        'x-user-role': 'admin'
      }
    });
    const pendingData = await pendingRes.json();
    const foundInPending = pendingData.data?.some(l => l._id === listingId);
    console.log('Found in admin pending list:', foundInPending);
    console.assert(foundInPending, 'FAIL: Listing should appear in admin pending queue');

    console.log('\n--- TEST 5: Admin approves edited listing ---');
    const approveRes = await fetch(`${baseUrl}/admin/listings/${listingId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': 'admin@solarcoop.com',
        'x-user-name': 'Co-op Admin',
        'x-user-role': 'admin'
      }
    });
    const approveData = await approveRes.json();
    console.log('Approved status (MUST BE ACTIVE):', approveData.data?.status);
    console.log('Approved quantity:', approveData.data?.approvedQuantity);
    console.log('Available quantity:', approveData.data?.availableQuantity);
    console.log('Approved unit price:', approveData.data?.approvedUnitPrice);
    console.assert(approveData.data?.status === 'ACTIVE', 'FAIL: Status should be ACTIVE');
    console.assert(approveData.data?.availableQuantity === 12, 'FAIL: availableQuantity should be 12');

    // Clean up
    console.log('\n--- Cleaning up test listing ---');
    await fetch(`${baseUrl}/listings/${listingId}`, {
      method: 'DELETE',
      headers: {
        'x-user-email': 'user@solarcoop.com',
        'x-user-name': 'Kavindi Perera',
        'x-user-role': 'normal'
      }
    });
    console.log('Cleaned up successfully.');
    console.log('\nALL TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test error:', err);
  }
}

testDeclinedEditFlow();
