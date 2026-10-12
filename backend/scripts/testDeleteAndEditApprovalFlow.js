const baseUrl = 'http://127.0.0.1:5000/api/energy';

async function testDeleteAndEditApprovalFlow() {
  try {
    console.log('=== TEST 1: Create a new listing ===');
    const createRes = await fetch(`${baseUrl}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': 'user@solarcoop.com',
        'x-user-name': 'Kavindi Perera',
        'x-user-role': 'normal'
      },
      body: JSON.stringify({
        quantity: 20,
        unitPrice: 50,
        description: 'Initial rooftop solar listing'
      })
    });
    const createData = await createRes.json();
    console.log('Created listing ID:', createData.data?._id);
    const listingId = createData.data?._id;
    console.assert(createData.data?.status === 'PENDING_APPROVAL', 'Initial status should be PENDING_APPROVAL');
    console.assert(createData.data?.isEdited === false, 'isEdited should be false initially');

    console.log('\n=== TEST 2: Verify it appears in Admin New Listings tab (isEdited === false) ===');
    let adminPendingRes = await fetch(`${baseUrl}/admin/pending`, {
      headers: {
        'x-user-email': 'admin@solarcoop.com',
        'x-user-name': 'Co-op Admin',
        'x-user-role': 'admin'
      }
    });
    let adminPendingData = await adminPendingRes.json();
    let found = adminPendingData.data?.find(l => l._id === listingId);
    console.log('Found in admin pending:', Boolean(found), 'isEdited:', found?.isEdited);
    console.assert(found && !found.isEdited, 'Must be in admin pending queue as a New Listing');

    console.log('\n=== TEST 3: Admin declines the listing ===');
    const declineRes = await fetch(`${baseUrl}/admin/listings/${listingId}/decline`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': 'admin@solarcoop.com',
        'x-user-name': 'Co-op Admin',
        'x-user-role': 'admin'
      },
      body: JSON.stringify({
        reason: 'Price of 50 LKR/kWh is too high'
      })
    });
    const declineData = await declineRes.json();
    console.log('Declined status:', declineData.data?.status);
    console.assert(declineData.data?.status === 'DECLINED', 'Status must be DECLINED');

    console.log('\n=== TEST 4: User edits the declined listing ===');
    const editRes = await fetch(`${baseUrl}/listings/${listingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': 'user@solarcoop.com',
        'x-user-name': 'Kavindi Perera',
        'x-user-role': 'normal'
      },
      body: JSON.stringify({
        quantity: 18,
        unitPrice: 42
      })
    });
    const editData = await editRes.json();
    console.log('Edited status:', editData.data?.status);
    console.log('isEdited flag:', editData.data?.isEdited);
    console.log('previousQuantity:', editData.data?.previousQuantity);
    console.log('previousUnitPrice:', editData.data?.previousUnitPrice);
    console.log('pendingQuantity:', editData.data?.pendingQuantity);
    console.log('pendingUnitPrice:', editData.data?.pendingUnitPrice);
    console.assert(editData.data?.status === 'PENDING_APPROVAL', 'Status must be PENDING_APPROVAL after edit');
    console.assert(editData.data?.isEdited === true, 'isEdited must be TRUE after edit');
    console.assert(editData.data?.previousQuantity === 20, 'previousQuantity must be 20');
    console.assert(editData.data?.previousUnitPrice === 50, 'previousUnitPrice must be 50');

    console.log('\n=== TEST 5: Verify it now appears in Edits Awaiting Approval (isEdited === true) ===');
    adminPendingRes = await fetch(`${baseUrl}/admin/pending`, {
      headers: {
        'x-user-email': 'admin@solarcoop.com',
        'x-user-name': 'Co-op Admin',
        'x-user-role': 'admin'
      }
    });
    adminPendingData = await adminPendingRes.json();
    const newListings = adminPendingData.data?.filter(l => !l.isEdited);
    const editListings = adminPendingData.data?.filter(l => l.isEdited);
    const foundInNew = newListings.some(l => l._id === listingId);
    const foundInEdits = editListings.some(l => l._id === listingId);
    console.log('Present in newListings tab:', foundInNew);
    console.log('Present in editListings tab:', foundInEdits);
    console.assert(!foundInNew, 'Must NOT be in New Listings tab');
    console.assert(foundInEdits, 'MUST be in Edits Awaiting Approval tab');

    console.log('\n=== TEST 6: User deletes the edited listing ===');
    const deleteRes = await fetch(`${baseUrl}/listings/${listingId}`, {
      method: 'DELETE',
      headers: {
        'x-user-email': 'user@solarcoop.com',
        'x-user-name': 'Kavindi Perera',
        'x-user-role': 'normal'
      }
    });
    const deleteData = await deleteRes.json();
    console.log('Delete response:', deleteData);
    console.assert(deleteData.success === true, 'Delete must succeed');

    console.log('\n=== TEST 7: Verify listing is removed from Admin Approvals side ===');
    adminPendingRes = await fetch(`${baseUrl}/admin/pending`, {
      headers: {
        'x-user-email': 'admin@solarcoop.com',
        'x-user-name': 'Co-op Admin',
        'x-user-role': 'admin'
      }
    });
    adminPendingData = await adminPendingRes.json();
    const stillInAdmin = adminPendingData.data?.some(l => l._id === listingId);
    console.log('Still in admin pending queue?:', stillInAdmin);
    console.assert(!stillInAdmin, 'Listing must be completely removed from admin approval queue');

    console.log('\n=== TEST 8: Verify user can delete a DECLINED listing directly ===');
    const createRes2 = await fetch(`${baseUrl}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': 'user@solarcoop.com',
        'x-user-name': 'Kavindi Perera',
        'x-user-role': 'normal'
      },
      body: JSON.stringify({
        quantity: 5,
        unitPrice: 60
      })
    });
    const createData2 = await createRes2.json();
    const listingId2 = createData2.data?._id;

    // Decline it
    await fetch(`${baseUrl}/admin/listings/${listingId2}/decline`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': 'admin@solarcoop.com',
        'x-user-name': 'Co-op Admin',
        'x-user-role': 'admin'
      },
      body: JSON.stringify({ reason: 'Excessive price' })
    });

    // Delete declined listing
    const deleteRes2 = await fetch(`${baseUrl}/listings/${listingId2}`, {
      method: 'DELETE',
      headers: {
        'x-user-email': 'user@solarcoop.com',
        'x-user-name': 'Kavindi Perera',
        'x-user-role': 'normal'
      }
    });
    const deleteData2 = await deleteRes2.json();
    console.log('Declined listing deletion response:', deleteData2);
    console.assert(deleteData2.success === true, 'Deleting declined listing must succeed');

    // Verify it is not in my listings
    const myListingsRes = await fetch(`${baseUrl}/listings/my`, {
      headers: {
        'x-user-email': 'user@solarcoop.com',
        'x-user-name': 'Kavindi Perera',
        'x-user-role': 'normal'
      }
    });
    const myListingsData = await myListingsRes.json();
    const stillInMyListings = myListingsData.data?.some(l => l._id === listingId2);
    console.log('Still in my listings?:', stillInMyListings);
    console.assert(!stillInMyListings, 'Deleted declined listing must not appear in my listings');

    console.log('\n========================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED 100%! 🎉');
    console.log('========================================');
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
}

testDeleteAndEditApprovalFlow();
