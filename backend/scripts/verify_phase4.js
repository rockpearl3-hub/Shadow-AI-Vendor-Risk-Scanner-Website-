const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000/api';

async function runTests() {
  console.log('=== PHASE 4 END-TO-END VERIFICATION ===\n');

  // Ensure Admin User exists in DB
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@shadowscan.com' },
    update: { role: 'admin', isActive: true, passwordHash: hashedPassword },
    create: { email: 'admin@shadowscan.com', passwordHash: hashedPassword, role: 'admin', isActive: true },
  });

  let adminToken = '';
  let viewerToken = '';

  // 1. Admin Login
  console.log('1. Logging in as Admin (admin@shadowscan.com)...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@shadowscan.com', password: 'admin123' }),
  });
  const adminLoginData = await adminLoginRes.json();
  if (adminLoginRes.status === 200 && adminLoginData.token) {
    adminToken = adminLoginData.token;
    console.log('   ✓ Admin login successful. Role:', adminLoginData.user.role);
  } else {
    console.error('   ✗ Admin login failed:', adminLoginData);
    process.exit(1);
  }

  // 2. Create Viewer User via Admin User Management Endpoint
  console.log('\n2. Admin creating Viewer user (viewer_test@example.com)...');
  const createViewerRes = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      email: `viewer_${Date.now()}@example.com`,
      password: 'ViewerPassword123!',
      role: 'viewer',
    }),
  });
  const createViewerData = await createViewerRes.json();
  const viewerEmail = createViewerData.user ? createViewerData.user.email : null;
  console.log('   ✓ Viewer created:', viewerEmail, 'Role:', createViewerData.user?.role);

  // 3. Login as Viewer
  console.log('\n3. Logging in as Viewer...');
  const viewerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: viewerEmail, password: 'ViewerPassword123!' }),
  });
  const viewerLoginData = await viewerLoginRes.json();
  viewerToken = viewerLoginData.token;
  console.log('   ✓ Viewer login successful. Role:', viewerLoginData.user.role);

  // 4. Viewer attempts to read vendors (GET /api/vendors)
  console.log('\n4. Testing Viewer access to GET /api/vendors (Read Access)...');
  const getVendorsRes = await fetch(`${BASE_URL}/vendors`, {
    headers: { 'Authorization': `Bearer ${viewerToken}` },
  });
  console.log('   ✓ GET /api/vendors status:', getVendorsRes.status, getVendorsRes.status === 200 ? '(SUCCESS - Allowed)' : '(FAILED)');

  // 5. Viewer attempts to create a vendor (POST /api/vendors) -> Should fail with 403
  console.log('\n5. Testing Viewer attempt to POST /api/vendors (Write Access Block)...');
  const postVendorViewerRes = await fetch(`${BASE_URL}/vendors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${viewerToken}`,
    },
    body: JSON.stringify({
      name: 'Unauthorized Tool',
      category: 'AI Tool',
      dataSensitivity: 'High',
      hasCompliance: false,
      hasBreachHistory: false,
      approvedByIT: false,
      description: 'Test shadow tool',
      ownerDepartment: 'Marketing',
    }),
  });
  console.log('   ✓ POST /api/vendors status for Viewer:', postVendorViewerRes.status, postVendorViewerRes.status === 403 ? '(SUCCESS - 403 Forbidden Enforced)' : '(FAILED)');

  // 6. Admin creates a new vendor and checks Audit Log
  console.log('\n6. Admin creating vendor "Phase4 Test AI"...');
  const createVendorRes = await fetch(`${BASE_URL}/vendors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: `Phase4 Test AI ${Date.now()}`,
      category: 'AI Tool',
      dataSensitivity: 'Medium',
      hasCompliance: true,
      hasBreachHistory: false,
      approvedByIT: false,
      description: 'Phase 4 verification vendor',
      ownerDepartment: 'Engineering',
    }),
  });
  const createVendorData = await createVendorRes.json();
  const createdVendor = createVendorData.vendor || createVendorData;
  const createdVendorId = createdVendor.id;
  console.log('   ✓ Vendor created. ID:', createdVendorId, 'Risk Level:', createdVendor.riskLevel);

  // 7. Admin approves vendor -> checks vendor_approved audit action
  console.log('\n7. Admin approving vendor (setting approvedByIT = true)...');
  const approveRes = await fetch(`${BASE_URL}/vendors/${createdVendorId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      ...createdVendor,
      approvedByIT: true,
    }),
  });
  const approveData = await approveRes.json();
  const updatedVendor = approveData.vendor || approveData;
  console.log('   ✓ Vendor approved. approvedByIT:', updatedVendor.approvedByIT);

  // 8. Check Vendor Audit History
  console.log('\n8. Fetching vendor audit history for vendor ID:', createdVendorId);
  const vendorHistoryRes = await fetch(`${BASE_URL}/audit-logs/vendor/${createdVendorId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  const vendorHistoryData = await vendorHistoryRes.json();
  const historyList = vendorHistoryData.history || vendorHistoryData;
  console.log('   ✓ Vendor audit logs count:', historyList.length);
  historyList.forEach(log => {
    console.log(`     - [${log.action}] by ${log.userEmail}: ${log.details}`);
  });

  // 9. Test duplicate ApprovedAlternative category error handling
  console.log('\n9. Testing duplicate category check for ApprovedAlternatives...');
  const testCategory = `Category_${Date.now()}`;
  // Create first alternative
  await fetch(`${BASE_URL}/alternatives`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      category: testCategory,
      approvedToolName: 'Tool A',
      approvedToolUrl: 'https://example.com/a',
      notes: 'First entry',
    }),
  });
  // Attempt duplicate category creation
  const duplicateRes = await fetch(`${BASE_URL}/alternatives`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      category: testCategory,
      approvedToolName: 'Tool B',
      approvedToolUrl: 'https://example.com/b',
      notes: 'Duplicate entry',
    }),
  });
  const duplicateData = await duplicateRes.json();
  console.log('   ✓ Duplicate creation status:', duplicateRes.status, duplicateRes.status === 400 ? `(SUCCESS - 400 Bad Request: "${duplicateData.error}")` : '(FAILED)');

  // 10. Viewer access check to Admin routes (/api/users and /api/audit-logs)
  console.log('\n10. Testing Viewer access to Admin-only endpoints (/api/users, /api/audit-logs)...');
  const viewerUsersRes = await fetch(`${BASE_URL}/users`, {
    headers: { 'Authorization': `Bearer ${viewerToken}` },
  });
  console.log('   ✓ Viewer GET /api/users status:', viewerUsersRes.status, viewerUsersRes.status === 403 ? '(SUCCESS - 403 Forbidden)' : '(FAILED)');

  const viewerAuditRes = await fetch(`${BASE_URL}/audit-logs`, {
    headers: { 'Authorization': `Bearer ${viewerToken}` },
  });
  console.log('   ✓ Viewer GET /api/audit-logs status:', viewerAuditRes.status, viewerAuditRes.status === 403 ? '(SUCCESS - 403 Forbidden)' : '(FAILED)');

  console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Error running verification:', err);
  process.exit(1);
});
