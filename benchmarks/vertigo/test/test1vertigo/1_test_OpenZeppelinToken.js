const OpenZeppelinToken = artifacts.require("OpenZeppelinToken");

contract("OpenZeppelinToken", accounts => {
  const [owner, recipient, spender, anotherAccount] = accounts;
  const initialSupply = web3.utils.toWei("1000", "ether");

  let token;

  beforeEach(async () => {
    token = await OpenZeppelinToken.new("OpenZeppelin Token", "OZT", initialSupply, { from: owner });
  });

  it("should deploy with correct metadata and initial supply", async () => {
    assert.equal(await token.name(), "OpenZeppelin Token");
    assert.equal(await token.symbol(), "OZT");
    assert.equal((await token.decimals()).toNumber(), 18);
    assert.equal((await token.totalSupply()).toString(), initialSupply);
    assert.equal((await token.balanceOf(owner)).toString(), initialSupply);
  });

  it("should transfer tokens correctly", async () => {
    const transferAmount = web3.utils.toWei("100", "ether");
    await token.transfer(recipient, transferAmount, { from: owner });

    const ownerBalance = await token.balanceOf(owner);
    const recipientBalance = await token.balanceOf(recipient);

    assert.equal(ownerBalance.toString(), web3.utils.toWei("900", "ether"));
    assert.equal(recipientBalance.toString(), transferAmount);
  });

  it("should reject transfer exceeding balance", async () => {
    const transferAmount = web3.utils.toWei("1001", "ether");
    try {
      await token.transfer(recipient, transferAmount, { from: owner });
      assert.fail("Should have reverted on transfer exceeding balance");
    } catch (error) {
      assert(error.message.includes("subtraction overflow") || error.message.includes("revert"));
    }
  });

  it("should handle approvals and transferFrom correctly", async () => {
    const approveAmount = web3.utils.toWei("200", "ether");
    const spendAmount = web3.utils.toWei("150", "ether");

    await token.approve(spender, approveAmount, { from: owner });
    assert.equal((await token.allowance(owner, spender)).toString(), approveAmount);

    await token.transferFrom(owner, recipient, spendAmount, { from: spender });

    assert.equal((await token.balanceOf(recipient)).toString(), spendAmount);
    assert.equal((await token.allowance(owner, spender)).toString(), web3.utils.toWei("50", "ether"));
  });

  it("should reject transferFrom exceeding allowance", async () => {
    const approveAmount = web3.utils.toWei("50", "ether");
    const spendAmount = web3.utils.toWei("60", "ether");

    await token.approve(spender, approveAmount, { from: owner });
    try {
      await token.transferFrom(owner, recipient, spendAmount, { from: spender });
      assert.fail("Should have reverted on exceeding allowance");
    } catch (error) {
      assert(error.message.includes("subtraction overflow") || error.message.includes("revert"));
    }
  });

  it("should allow owner to mint new tokens", async () => {
    const mintAmount = web3.utils.toWei("500", "ether");
    await token.mint(recipient, mintAmount, { from: owner });

    assert.equal((await token.totalSupply()).toString(), web3.utils.toWei("1500", "ether"));
    assert.equal((await token.balanceOf(recipient)).toString(), mintAmount);
  });

  it("should reject minting from non-owner", async () => {
    const mintAmount = web3.utils.toWei("100", "ether");
    try {
      await token.mint(recipient, mintAmount, { from: anotherAccount });
      assert.fail("Should have reverted on non-owner minting");
    } catch (error) {
      assert(error.message.includes("not the owner") || error.message.includes("revert"));
    }
  });

  it("should burn tokens correctly", async () => {
    const burnAmount = web3.utils.toWei("100", "ether");
    await token.burn(burnAmount, { from: owner });

    assert.equal((await token.totalSupply()).toString(), web3.utils.toWei("900", "ether"));
    assert.equal((await token.balanceOf(owner)).toString(), web3.utils.toWei("900", "ether"));
  });

  it("should pause and unpause transfers correctly by owner", async () => {
    await token.pause({ from: owner });
    assert.equal(await token.paused(), true);

    const amount = web3.utils.toWei("10", "ether");
    try {
      await token.transfer(recipient, amount, { from: owner });
      assert.fail("Transfer should be blocked when paused");
    } catch (error) {
      assert(error.message.includes("paused") || error.message.includes("revert"));
    }

    await token.unpause({ from: owner });
    assert.equal(await token.paused(), false);

    await token.transfer(recipient, amount, { from: owner });
    assert.equal((await token.balanceOf(recipient)).toString(), amount);
  });

  it("should handle ownership transfers properly", async () => {
    await token.transferOwnership(recipient, { from: owner });
    assert.equal(await token.owner(), recipient);

    try {
      await token.pause({ from: owner });
      assert.fail("Previous owner shouldn't be able to pause");
    } catch (error) {
      assert(error.message.includes("not the owner") || error.message.includes("revert"));
    }

    await token.pause({ from: recipient });
    assert.equal(await token.paused(), true);
  });
});