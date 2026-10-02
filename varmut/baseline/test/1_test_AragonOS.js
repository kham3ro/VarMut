const Kernel = artifacts.require("Kernel");
const ACL = artifacts.require("ACL");
const AragonVaultApp = artifacts.require("AragonVaultApp");

contract("AragonOS Core & Vault App", accounts => {
  const [root, daoAdmin, member1, member2, stranger] = accounts;

  let kernel;
  let acl;
  let vault;

  const WITHDRAW_ROLE = web3.utils.soliditySha3("WITHDRAW_ROLE");
  const CREATE_PERMISSIONS_ROLE = web3.utils.soliditySha3("CREATE_PERMISSIONS_ROLE");

  beforeEach(async () => {
    kernel = await Kernel.new({ from: root });
    acl = await ACL.new({ from: root });

    await kernel.initialize(acl.address, daoAdmin, { from: root });
    await acl.initialize(daoAdmin, { from: root });

    vault = await AragonVaultApp.new(kernel.address, { from: root });
  });

  it("should initialize Kernel and ACL correctly", async () => {
    assert.equal(await kernel.acl(), acl.address);
    assert.equal(await kernel.kernelOwner(), daoAdmin);
    assert.equal(await kernel.initialized(), true);

    const hasCreatePerm = await acl.hasPermission(daoAdmin, acl.address, CREATE_PERMISSIONS_ROLE);
    assert.equal(hasCreatePerm, true);
  });

  it("should create a permission and assign permission manager", async () => {
    await acl.createPermission(member1, vault.address, WITHDRAW_ROLE, daoAdmin, { from: daoAdmin });

    const hasWithdraw = await acl.hasPermission(member1, vault.address, WITHDRAW_ROLE);
    assert.equal(hasWithdraw, true);

    const manager = await acl.getPermissionManager(vault.address, WITHDRAW_ROLE);
    assert.equal(manager, daoAdmin);
  });

  it("should allow permission manager to grant and revoke permission", async () => {
    await acl.createPermission(member1, vault.address, WITHDRAW_ROLE, daoAdmin, { from: daoAdmin });

    await acl.grantPermission(member2, vault.address, WITHDRAW_ROLE, { from: daoAdmin });
    assert.equal(await acl.hasPermission(member2, vault.address, WITHDRAW_ROLE), true);

    await acl.revokePermission(member1, vault.address, WITHDRAW_ROLE, { from: daoAdmin });
    assert.equal(await acl.hasPermission(member1, vault.address, WITHDRAW_ROLE), false);
  });

  it("should reject non-manager from granting or revoking permissions", async () => {
    await acl.createPermission(member1, vault.address, WITHDRAW_ROLE, daoAdmin, { from: daoAdmin });

    try {
      await acl.grantPermission(stranger, vault.address, WITHDRAW_ROLE, { from: stranger });
      assert.fail("Should have failed non-manager grant");
    } catch (e) {
      assert(e.message.includes("CALLER_NOT_ROLE_MANAGER") || e.message.includes("revert"));
    }

    try {
      await acl.revokePermission(member1, vault.address, WITHDRAW_ROLE, { from: stranger });
      assert.fail("Should have failed non-manager revoke");
    } catch (e) {
      assert(e.message.includes("CALLER_NOT_ROLE_MANAGER") || e.message.includes("revert"));
    }
  });

  it("should allow setting a new permission manager", async () => {
    await acl.createPermission(member1, vault.address, WITHDRAW_ROLE, daoAdmin, { from: daoAdmin });

    await acl.setPermissionManager(member2, vault.address, WITHDRAW_ROLE, { from: daoAdmin });
    assert.equal(await acl.getPermissionManager(vault.address, WITHDRAW_ROLE), member2);

    try {
      await acl.grantPermission(stranger, vault.address, WITHDRAW_ROLE, { from: daoAdmin });
      assert.fail("Old manager shouldn't grant");
    } catch (e) {
      assert(e.message.includes("CALLER_NOT_ROLE_MANAGER") || e.message.includes("revert"));
    }

    await acl.grantPermission(stranger, vault.address, WITHDRAW_ROLE, { from: member2 });
    assert.equal(await acl.hasPermission(stranger, vault.address, WITHDRAW_ROLE), true);
  });

  it("should handle deposit and authorized withdraw in Vault App", async () => {
    await acl.createPermission(member1, vault.address, WITHDRAW_ROLE, daoAdmin, { from: daoAdmin });

    const depositAmount = web3.utils.toWei("5", "ether");
    await vault.deposit({ from: member2, value: depositAmount });

    assert.equal((await vault.totalVaultBalance()).toString(), depositAmount);
    assert.equal(await web3.eth.getBalance(vault.address), depositAmount);

    const withdrawAmount = web3.utils.toWei("2", "ether");
    const recipientBalanceBefore = await web3.eth.getBalance(member2);

    await vault.withdraw(member2, withdrawAmount, { from: member1 });

    const recipientBalanceAfter = await web3.eth.getBalance(member2);
    const gain = BigInt(recipientBalanceAfter) - BigInt(recipientBalanceBefore);
    assert.equal(gain.toString(), withdrawAmount);

    assert.equal((await vault.totalVaultBalance()).toString(), web3.utils.toWei("3", "ether"));
  });

  it("should reject withdraw from unauthorized entity", async () => {
    await acl.createPermission(member1, vault.address, WITHDRAW_ROLE, daoAdmin, { from: daoAdmin });

    const depositAmount = web3.utils.toWei("5", "ether");
    await vault.deposit({ from: member2, value: depositAmount });

    try {
      await vault.withdraw(stranger, web3.utils.toWei("1", "ether"), { from: stranger });
      assert.fail("Should have failed auth check");
    } catch (e) {
      assert(e.message.includes("AUTH_FAILED") || e.message.includes("revert"));
    }
  });

  it("should reject withdraw exceeding vault balance", async () => {
    await acl.createPermission(member1, vault.address, WITHDRAW_ROLE, daoAdmin, { from: daoAdmin });

    await vault.deposit({ from: member2, value: web3.utils.toWei("1", "ether") });

    try {
      await vault.withdraw(member1, web3.utils.toWei("2", "ether"), { from: member1 });
      assert.fail("Should have failed balance check");
    } catch (e) {
      assert(e.message.includes("INSUFFICIENT_BALANCE") || e.message.includes("INSUFFICIENT_VAULT_BALANCE") || e.message.includes("revert"));
    }
  });
});