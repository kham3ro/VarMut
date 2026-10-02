const CrowfundingCampaign = artifacts.require("CrowdfundingCampaign");
const IterableAddressMapping = artifacts.require("IterableAddressMapping");
const AscendingOrderedStack = artifacts.require("AscendingOrderedStack");
const CrowdfundingCampaignMilestoneSystem = artifacts.require("CrowdfundingCampaignMilestoneSystem");

const advanceBlockAtTime = (time) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [time],
        id: new Date().getTime(),
      },
      (err, _) => {
        if (err) {
          return reject(err);
        }
        const newBlockHash = web3.eth.getBlock("latest").hash;

        return resolve(newBlockHash);
      },
    );
  });
};

const logo =  " ___                                        \n"+
        "  |  ._ _|_  _  ._ _   _. |  _.  _ _|_ o  _\n"+
        " _|_ | | |_ (/_ | (_| (_| | (_| (_  |_ | (_\n"+
        "                   _|                      \n"+
        "\n"+
        " _                \n"+
        "|_) _. ._   _|  _.\n"+
        "|  (_| | | (_| (_|\n"+
        "\n"+
        " _                    \n"+
        "|_)  _   _  _      _ \n"+
        "| \\ (/_ _> (_ |_| (/_\n"+
        "\n";

contract("Global Test", accounts => {
before(async () => {
    try {
      const lib_instance = await IterableAddressMapping.new();
      CrowfundingCampaign.link(lib_instance);
    } catch (e) {}
    try {
      const stack_instance = await AscendingOrderedStack.new();
      CrowfundingCampaign.link(stack_instance);
    } catch (e) {}
  });

  it("Intergalactic Panda Rescue use case test", async function(){
    console.log(logo);

    //Full Deploy with 2 organizers and 3 beneficiaries
    console.log("\t[ Test with 2 organizers and 3 beneficiaries ] \n\n");
    const instance = await CrowfundingCampaign.new([accounts[0],accounts[1]],[accounts[2],accounts[3],accounts[4]],60*60*1);
    const milestone_contract_address = await instance.milestone_contract();
    const milestone_contract = await CrowdfundingCampaignMilestoneSystem.at(milestone_contract_address);

    //Organizers make the initial donation
    console.log("___________Organizer make the initial donation_____________");
    let receipt = await instance.organizers_donation({value: 50000000000000000, from: accounts[0]});
    let balance_before = await web3.eth.getBalance(accounts[1]);
    receipt = await instance.organizers_donation({value: 50000000000000000, from: accounts[1]});
    let balance_after = await web3.eth.getBalance(accounts[1]);
    console.log("Gas used:       \t\t"+receipt.receipt.gasUsed);
    console.log("Balance before: \t\t"+balance_before);
    console.log("Balance after:  \t\t"+balance_after);
    console.log("\n\n");

    //Organizer set up a flag
    console.log("___________Organizer set up a flag_____________");
    balance_before = await web3.eth.getBalance(accounts[1]);          
    receipt = await instance.setup_reward('50000000000000000',{value: 20000000000000000, from: accounts[1]});
    balance_after = await web3.eth.getBalance(accounts[1]);
    console.log("Gas used: \t"+receipt.receipt.gasUsed);
    console.log("Balance before: \t\t"+balance_before);
    console.log("Balance after:  \t\t"+balance_after);
    console.log("\n\n");

    //Organizer set up a milestone
    console.log("___________Organizer set up a milestone_____________");
    balance_before = await web3.eth.getBalance(accounts[0]);                    
    receipt = await instance.new_milestone('1000000000000000000',{value: 50000000000000000, from: accounts[0]});
    balance_after = await web3.eth.getBalance(accounts[0]);
    console.log("Gas used:       \t\t"+receipt.receipt.gasUsed);
    console.log("Balance before: \t\t"+balance_before);
    console.log("Balance after:  \t\t"+balance_after);
    console.log("\n\n");

    //Organizer set up another flag
    console.log("___________Organizer set up another flag_____________");
    balance_before = await web3.eth.getBalance(accounts[1]);
    receipt = await instance.setup_reward('500000000000000000000',{value: 20000000000000000, from: accounts[1]});
    balance_after = await web3.eth.getBalance(accounts[1]);
    console.log("Gas used:       \t\t"+receipt.receipt.gasUsed);
    console.log("Balance before: \t\t"+balance_before);
    console.log("Balance after:  \t\t"+balance_after);
    console.log("\n\n");

    //Organizer set up another milestone
    console.log("___________Organizer set up another milestone_____________");
    balance_before = await web3.eth.getBalance(accounts[0]);
    receipt = await instance.new_milestone('100000000000000000000',{value: 50000000000000000, from: accounts[0]});
    balance_after = await web3.eth.getBalance(accounts[0]);
    console.log("Gas used:       \t\t"+receipt.receipt.gasUsed);
    console.log("Balance before: \t\t"+balance_before);
    console.log("Balance after:  \t\t"+balance_after);
    console.log("\n\n");

    //Fair donation
    console.log("___________Fair donation_____________");
    balance_before = await web3.eth.getBalance(accounts[5]);
    receipt = await instance.fair_donation({value: 500000000000000000, from: accounts[5]});
    balance_after = await web3.eth.getBalance(accounts[5]);
    console.log("Gas used:       \t\t"+receipt.receipt.gasUsed);
    console.log("Balance before: \t\t"+balance_before);
    console.log("Balance after:  \t\t"+balance_after);
    console.log("\n\n");

    //Unfair donation
    console.log("___________Unfair donation_____________");
    balance_before = await web3.eth.getBalance(accounts[6]);                                        
    receipt = await instance.unfair_donation(['250000000000000000','250000000000000000','0'],{value: 500000000000000000, from: accounts[6]});
    balance_after = await web3.eth.getBalance(accounts[6]);
    console.log("Gas used:       \t\t"+receipt.receipt.gasUsed);
    console.log("Balance before: \t\t"+balance_before);
    console.log("Balance after:  \t\t"+balance_after);
    console.log("\n\n");

    //Fair donation
    console.log("___________Fair donation_____________");
    balance_before = await web3.eth.getBalance(accounts[5]);
    receipt = await instance.fair_donation({value: 500000000000000000, from: accounts[5]});
    balance_after = await web3.eth.getBalance(accounts[5]);
    console.log("Gas used:       \t\t"+receipt.receipt.gasUsed);
    console.log("Balance before: \t\t"+balance_before);
    console.log("Balance after:  \t\t"+balance_after);
    console.log("\n\n");

    //Unfair donation
    console.log("___________Unfair donation_____________");
    balance_before = await web3.eth.getBalance(accounts[6]);                                        
    receipt = await instance.unfair_donation(['250000000000000000','250000000000000000','0'],{value: 500000000000000000, from: accounts[6]});
    balance_after = await web3.eth.getBalance(accounts[6]);
    console.log("Gas used:       \t\t"+receipt.receipt.gasUsed);
    console.log("Balance before: \t\t"+balance_before);
    console.log("Balance after:  \t\t"+balance_after);
    console.log("\n\n");

    //Time is over
    console.log("___________Time is over_____________\n\n");
    receipt = await advanceBlockAtTime((60*60*2)+(60*5));

    //Beneficiary1 withdraw
    console.log("___________Beneficiary1 withdraw_____________");
    balance_before = await web3.eth.getBalance(accounts[2]);
    receipt = await instance.withdraw({from: accounts[2]});
    balance_after = await web3.eth.getBalance(accounts[2]);
    console.log("Gas used:       \t\t"+receipt.receipt.gasUsed);
    console.log("Balance before: \t\t"+balance_before);
    console.log("Balance after:  \t\t"+balance_after);
    console.log("\n\n");

    //Beneficiary2 withdraw
    console.log("___________Beneficiary2 withdraw_____________");
    balance_before = await web3.eth.getBalance(accounts[3]);
    receipt = await instance.withdraw({from: accounts[3]});
    balance_after = await web3.eth.getBalance(accounts[3]);
    console.log("Gas used:       \t\t"+receipt.receipt.gasUsed);
    console.log("Balance before: \t\t"+balance_before);
    console.log("Balance after:  \t\t"+balance_after);
    console.log("\n\n");

    //Beneficiary3 withdraw
    console.log("___________Beneficiary3 withdraw_____________");
    balance_before = await web3.eth.getBalance(accounts[4]);
    receipt = await instance.withdraw({from: accounts[4]});
    balance_after = await web3.eth.getBalance(accounts[4]);
    console.log("Gas used:       \t\t"+receipt.receipt.gasUsed);
    console.log("Balance before: \t\t"+balance_before);
    console.log("Balance after:  \t\t"+balance_after);
    console.log("\n\n");

    //Milestone refund
    console.log("___________Milestone refund_____________");
    balance_before = await web3.eth.getBalance(accounts[0]);
    receipt = await milestone_contract.refund(1,{from:accounts[0]});
    balance_after = await web3.eth.getBalance(accounts[0]);
    console.log("Gas used:       \t\t"+receipt.receipt.gasUsed);
    console.log("Balance before: \t\t"+balance_before);
    console.log("Balance after:  \t\t"+balance_after);
    console.log("\n\n");

    //Close contracts
    console.log("___________Close contracts_____________");
    balance_before = await web3.eth.getBalance(accounts[1]);
    receipt = await instance.close({from: accounts[1]});
    balance_after = await web3.eth.getBalance(accounts[1]);
    const tx = await web3.eth.getTransaction(receipt.tx);
    let expected_balance_after = BigInt(balance_before)-(BigInt(receipt.receipt.gasUsed)*BigInt(tx.gasPrice));
    console.log("Expected balance After:            \t\t"+expected_balance_after);
    balance_before = await web3.eth.getBalance(accounts[1]);
    receipt = await milestone_contract.close({from: accounts[1]});
    balance_after = await web3.eth.getBalance(accounts[1]);
    console.log("\n\n");
  });
});