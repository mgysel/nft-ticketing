const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const EVM_REVERT = 'VM Exception while processing transaction: revert'

// NOTE: ETHEREUM STORES BIG NUMBERS THAT JS CANNOT COMPILE,
// FOLLOW THE describe('comparison') EXAMPLES FOR HOW TO COMPARE NUMBERS
// accounts - the accounts from Ganache
// async - to interact with blockchain, must use async calls
describe('Event', (accounts) => {
  // Variables for creating the Event Contract
  const _numTickets = 5;
  const _price = 50;
  const _canBeResold = true;
  const _royaltyPercent = 20;
  const _eventName = 'EventName'
  const _eventSymbol = 'EventSymbol'
  
  async function deployEventFixture() {
    // Get the ContractFactory and Signers here.
    const Event = await ethers.getContractFactory("Event");
    const [owner, buyer1, buyer2, buyer3, buyer4, buyer5, buyer6, buyer7] = await ethers.getSigners();

    // Deploy Event contract
    const hardhatEvent = await Event.deploy(owner.address, _numTickets, _price, _canBeResold, _royaltyPercent, _eventName, _eventSymbol);

    await hardhatEvent.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { Event, hardhatEvent, owner, buyer1, buyer2, buyer3, buyer4, buyer5, buyer6, buyer7 };
  }

  // Event contract deployment
  describe("Deployment", function () {
    it("Should deploy correctly", async function () {
      const { hardhatEvent } = await loadFixture(deployEventFixture);

      expect(await hardhatEvent.address).to.not.equal('');
      expect(await hardhatEvent.address).to.not.equal(0x0);
      expect(await hardhatEvent.address).to.not.equal(null);
      expect(await hardhatEvent.address).to.not.equal(undefined);
    });
  });

  describe('constructor', async () => {
    it('checking contract owner set correctly', async () => {
      const { hardhatEvent, owner } = await loadFixture(deployEventFixture);
      expect(await hardhatEvent.owner()).to.equal(owner.address);
    });

    it('checking eventName', async () => {
      const { hardhatEvent } = await loadFixture(deployEventFixture);
      expect(await hardhatEvent.name()).to.equal(_eventName);
    });

    it('checking eventSymbol', async () => {
      const { hardhatEvent } = await loadFixture(deployEventFixture);
      expect(await hardhatEvent.symbol()).to.equal(_eventSymbol);
    });

    it('checking numTicketsLeft set correctly', async () => {
      const { hardhatEvent } = await loadFixture(deployEventFixture);
      expect(await hardhatEvent.numTicketsLeft()).to.equal(_numTickets);
    });

    it('checking price set correctly', async () => {
      const { hardhatEvent } = await loadFixture(deployEventFixture);
      expect(await hardhatEvent.price()).to.equal(_price);
    });

    it('checking canBeResold set correctly', async () => {
      const { hardhatEvent } = await loadFixture(deployEventFixture);
      expect(await hardhatEvent.canBeResold()).to.equal(_canBeResold);
    });

    it('checking royaltyPercent set correctly', async () => {
      const { hardhatEvent } = await loadFixture(deployEventFixture);
      expect(await hardhatEvent.royaltyPercent()).to.equal(_royaltyPercent);
    })

    it('invalid constructor arguments', async() => {
      const Event = await ethers.getContractFactory("Event");
      const [owner, buyer1, buyer2, buyer3, buyer4, buyer5, buyer6, buyer7] = await ethers.getSigners();

      // Owner must be address
      const invalidNumTickets = 0;
      await expect(Event.deploy(owner.address, invalidNumTickets, _price, _canBeResold, _royaltyPercent, _eventName, _eventSymbol))
      .to.be.reverted;

      const invalidRoyaltyPercent = 101 
      await expect(Event.deploy(owner.address, _numTickets, _price, _canBeResold, invalidRoyaltyPercent, _eventName, _eventSymbol))
      .to.be.reverted;
    })
  });

  async function deployEventFixtureSetStage() {
    // Get the ContractFactory and Signers here.
    const Event = await ethers.getContractFactory("Event");
    const [owner, buyer1, buyer2, buyer3, buyer4, buyer5, buyer6, buyer7] = await ethers.getSigners();

    // Deploy Event contract
    const hardhatEvent = await Event.deploy(owner.address, _numTickets, _price, _canBeResold, _royaltyPercent, _eventName, _eventSymbol);

    await hardhatEvent.deployed();
    await hardhatEvent.connect(owner).setStage(1);

    // Fixtures can return anything you consider useful for your tests
    return { Event, hardhatEvent, owner, buyer1, buyer2, buyer3, buyer4, buyer5, buyer6, buyer7 };
  }

  describe('buyTicket', async () => {

    it('checking cannot buy ticket unless active stage', async () => {
      const { hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixture);

      // Prep (0) Stage
      // enum Stages { Prep, Active, CheckinOpen, Cancelled, Closed }
      await hardhatEvent.connect(owner).setStage(0);
      await expect(hardhatEvent.connect(buyer1).buyTicket()).to.be.reverted;
      // // Paused (2) Stage
      await hardhatEvent.connect(owner).setStage(3);
      await expect(hardhatEvent.connect(buyer1).buyTicket()).to.be.reverted;
      // // Cancelled (4) Stage
      await hardhatEvent.connect(owner).setStage(4);
      await expect(hardhatEvent.connect(buyer1).buyTicket()).to.be.reverted;
    })

    // it('checking buyTicket Event', async () => {
    //   const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      
    //   let ticket1 = await hardhatEvent.connect(buyer1).buyTicket({ value: _price})
    //   expect(ticket1).emit(hardhatEvent, "CreateTicket").withArgs(Event.address, _eventName, buyer1.address, '0');
    // })

    it('checking user receives NFT after buying ticket', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      let bal = await hardhatEvent.balanceOf(buyer1.address);
      expect(bal).to.equal(0);

      await hardhatEvent.connect(buyer1).buyTicket({ value: ethers.utils.parseEther(_price.toString())});
      bal = await hardhatEvent.balanceOf(buyer1.address);
      expect(bal).to.equal(1);

      await hardhatEvent.connect(buyer1).buyTicket({ value: ethers.utils.parseEther(_price.toString())});
      bal = await hardhatEvent.balanceOf(buyer1.address);
      expect(bal).to.equal(2);
    })

    it('checking SC balance increases after ticket purchase', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      const provider = ethers.provider;

      let balanceBefore = await provider.getBalance(hardhatEvent.address);
      await hardhatEvent.connect(buyer1).buyTicket({ value: ethers.utils.parseEther(_price.toString())});
      let balanceAfter = await provider.getBalance(hardhatEvent.address);

      expect(balanceBefore.add(ethers.utils.parseEther(_price.toString()))).to.equal(balanceAfter);
    })
    
    it('checking balances of owner increases after ticket purchase', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      const provider = ethers.provider;

      let balanceBefore = await provider.getBalance(hardhatEvent.address);
      const overpay = 1;
      await hardhatEvent.connect(buyer1).buyTicket({ value: ethers.utils.parseEther((_price + overpay).toString())});
      let balanceAfter = await provider.getBalance(hardhatEvent.address);

      expect(parseInt(balanceBefore) + _price + overpay)
      .to.eql(parseInt(ethers.utils.formatEther(balanceAfter)));
    })
    
    it('checking balances of buyer increases after overpay', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      const provider = ethers.provider;

      let balanceBefore = await hardhatEvent.connect(buyer1).balanceOf(buyer1.address);
      const overpay = 1;
      await hardhatEvent.connect(buyer1).buyTicket({ value: ethers.utils.parseEther((_price + overpay).toString())});
      let balanceAfter = await hardhatEvent.connect(buyer1).balanceOf(buyer1.address);

      expect(parseInt(balanceBefore) + overpay).to.eql(parseInt(balanceAfter))

    })

    it('checking buyer balance decreases after ticket purchase', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      const provider = ethers.provider;

      let balanceBefore = await provider.getBalance(buyer1.address);
      const overpay = 1;
      await hardhatEvent.connect(buyer1).buyTicket({ value: _price + overpay});
      let balanceAfter = await provider.getBalance(buyer1.address);

      expect(parseInt(balanceBefore) - _price - overpay).is.greaterThan(parseInt(balanceAfter))
    })

    it('checking not enough money to buy ticket', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);

      await expect(hardhatEvent.connect(buyer1).buyTicket({ value: _price - 1})).to.be.reverted;
    })

    it('checking numTicketsLeft Decrements', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);

      const numTicketsBefore = await hardhatEvent.numTicketsLeft();
      await hardhatEvent.connect(buyer1).buyTicket({ value: _price});
      const numTicketsAfter = await hardhatEvent.numTicketsLeft();

      await expect(numTicketsBefore - 1).to.equal(numTicketsAfter);
    })

    // Not enough tickets left
    it('checking not enough tickets left', async () => {
      const { Event, hardhatEvent, owner, buyer1, buyer2, buyer3, buyer4, buyer5, buyer6 } = await loadFixture(deployEventFixtureSetStage);

      await hardhatEvent.connect(buyer1).buyTicket({ value: _price });
      await hardhatEvent.connect(buyer2).buyTicket({ value: _price });
      await hardhatEvent.connect(buyer3).buyTicket({ value: _price });
      await hardhatEvent.connect(buyer4).buyTicket({ value: _price });
      await hardhatEvent.connect(buyer5).buyTicket({ value: _price });

      await expect(hardhatEvent.connect(buyer6).buyTicket({ value: _price })).to.be.reverted;
    })
  })

  async function deployEventFixtureSetTicketUsed() {
    // Get the ContractFactory and Signers here.
    const Event = await ethers.getContractFactory("Event");
    const [owner, buyer1, buyer2, buyer3, buyer4, buyer5, buyer6, buyer7] = await ethers.getSigners();

    // Deploy Event contract
    const hardhatEvent = await Event.deploy(owner.address, _numTickets, _price, _canBeResold, _royaltyPercent, _eventName, _eventSymbol);

    await hardhatEvent.deployed();
    await hardhatEvent.connect(owner).setStage(1);
    await hardhatEvent.connect(buyer1).buyTicket({ value: _price });
    await hardhatEvent.connect(owner).setStage(2);

    // Fixtures can return anything you consider useful for your tests
    return { Event, hardhatEvent, owner, buyer1, buyer2, buyer3, buyer4, buyer5, buyer6, buyer7 };
  }

  describe('setTicketToUsed', async () => {

    it('checking cannot set Ticket To Used unless Checkin stage', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixture);

      // enum Stages { Prep, Active, CheckinOpen, Cancelled, Closed }
      // Prep (0) Stage
      await hardhatEvent.connect(owner).setStage(0);
      await expect(hardhatEvent.setTicketToUsed(1, "2")).to.be.reverted;

      // Active (1) Stage
      await hardhatEvent.connect(owner).setStage(1);
      await expect(hardhatEvent.setTicketToUsed(1, "2")).to.be.reverted;

      // Cancelled (3) Stage
      await hardhatEvent.connect(owner).setStage(3);
      await expect(hardhatEvent.setTicketToUsed(1, "2")).to.be.reverted;

      // Closed (4) Stage
      await hardhatEvent.connect(owner).setStage(4);
      await expect(hardhatEvent.setTicketToUsed(1, "2")).to.be.reverted;
    })
    
    it('checking ticket mark as used', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetTicketUsed);
      
      let ticketID = 0;
      let sQRCodeKey = "12345";
      let t = await hardhatEvent.connect(buyer1).setTicketToUsed(ticketID, sQRCodeKey);
      expect(t).emit(hardhatEvent, "TicketUsed").withArgs(ticketID, sQRCodeKey);
    })
  });

  async function deployEventFixtureBuyTicket() {
    // Get the ContractFactory and Signers here.
    const Event = await ethers.getContractFactory("Event");
    const [owner, buyer1, buyer2, buyer3, buyer4, buyer5, buyer6, buyer7] = await ethers.getSigners();

    // Deploy Event contract
    const hardhatEvent = await Event.deploy(owner.address, _numTickets, _price, _canBeResold, _royaltyPercent, _eventName, _eventSymbol);

    await hardhatEvent.deployed();
    await hardhatEvent.connect(owner).setStage(1);
    await hardhatEvent.connect(buyer1).buyTicket({ value: _price });

    // Fixtures can return anything you consider useful for your tests
    return { Event, hardhatEvent, owner, buyer1, buyer2, buyer3, buyer4, buyer5, buyer6, buyer7 };
  }

  describe('setTicketForSale', async () => {

    it('checking cannot set Ticket For Sale unless Active stage', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixture);

      // enum Stages { Prep, Active, CheckinOpen, Cancelled, Closed }
      await hardhatEvent.setStage(0);
      await expect(hardhatEvent.connect(buyer1).setTicketForSale(0, 100)).to.be.reverted;

      await hardhatEvent.setStage(2);
      await expect(hardhatEvent.connect(buyer1).setTicketForSale(0, 100)).to.be.reverted;

      await hardhatEvent.setStage(3);
      await expect(hardhatEvent.connect(buyer1).setTicketForSale(0, 100)).to.be.reverted;

      await hardhatEvent.setStage(4);
      await expect(hardhatEvent.connect(buyer1).setTicketForSale(0, 100)).to.be.reverted;
    })
      
    it('checking ticket mark as available for sale', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureBuyTicket);

      let t = await hardhatEvent.connect(buyer1).setTicketForSale(0, 100);
      expect(t).emit(hardhatEvent, "TicketForSale").withArgs(0, 100);
    })

    it('checking cannot set for sale if used', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureBuyTicket);

      await hardhatEvent.connect(owner).setStage(2);
      await hardhatEvent.connect(buyer1).setTicketToUsed(0, "12345");
      await expect(hardhatEvent.connect(buyer1).setTicketForSale(0, 100)).to.be.reverted;
    })
  })

  describe('Buy Ticket from User', async () => {
    it('checking cannot buy ticket from user unless stage active', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixture);

      // enum Stages { Prep, Active, CheckinOpen, Cancelled, Closed }
      await hardhatEvent.setStage(0);
      await expect(hardhatEvent.connect(buyer1).buyTicketFromUser(1)).to.be.reverted;

      await hardhatEvent.setStage(2);
      await expect(hardhatEvent.connect(buyer1).buyTicketFromUser(1)).to.be.reverted;

      await hardhatEvent.setStage(3);
      await expect(hardhatEvent.connect(buyer1).buyTicketFromUser(1)).to.be.reverted;

      await hardhatEvent.setStage(4);
      await expect(hardhatEvent.connect(buyer1).buyTicketFromUser(1)).to.be.reverted;
    })

    it('buy ticket from buyer 1', async () => {
      const { Event, hardhatEvent, owner, buyer1, buyer2 } = await loadFixture(deployEventFixtureBuyTicket);

      let ticketID = 0;
      let ticketPrice = 100;
      await hardhatEvent.connect(buyer1).setTicketForSale(ticketID, ticketPrice);
      await hardhatEvent.connect(buyer1).approveAsBuyer(buyer2.address, ticketID);
      let t = await hardhatEvent.connect(buyer2).buyTicketFromUser(ticketID, { value: ticketPrice });

      expect(t).emit(hardhatEvent, "TicketSold").withArgs(buyer2.address, ticketID);
    })

    it('ticket should belong to buyer 2', async () => {
      const { Event, hardhatEvent, owner, buyer1, buyer2 } = await loadFixture(deployEventFixtureBuyTicket);
      
      let ticketID = 0;
      let ticketPrice = 100;
      await hardhatEvent.connect(buyer1).setTicketForSale(ticketID, ticketPrice);
      await hardhatEvent.connect(buyer1).approveAsBuyer(buyer2.address, ticketID);
      await hardhatEvent.connect(buyer2).buyTicketFromUser(ticketID);
      let newTicketOwner = await hardhatEvent.ownerOf(ticketID);
      await expect(newTicketOwner).to.equal(buyer2.address);
    })

    it('checking buyer 2 recieves NFT after buying ticket from buyer 1', async () => {
      const { Event, hardhatEvent, owner, buyer1, buyer2 } = await loadFixture(deployEventFixtureBuyTicket);
      
      let ticketID = 0;
      let ticketPrice = 100;
      await hardhatEvent.connect(buyer1).setTicketForSale(ticketID, ticketPrice);
      await hardhatEvent.connect(buyer1).approveAsBuyer(buyer2.address, ticketID);
      await hardhatEvent.connect(buyer2).buyTicketFromUser(ticketID);
      let bal1 = await hardhatEvent.balanceOf(buyer1.address);
      let bal2 = await hardhatEvent.balanceOf(buyer2.address);

      await expect(bal1).to.equal(0);
      await expect(bal2).to.equal(1);
    })
  })
    
  describe('user withdraw if event is not cancelled', async () => {

    it('user can withdraw money after ticket overpay', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      const provider = ethers.provider;

      // Overpay for ticket
      overpay = 1;
      await hardhatEvent.connect(buyer1).buyTicket({ value: _price + overpay });

      // Check SC, User balances before withdraw
      let userBalanceBefore = await provider.getBalance(buyer1.address);
      let scBalanceBefore = await provider.getBalance(hardhatEvent.address);

      // Withdraw
      let tx = await hardhatEvent.connect(buyer1).withdraw();
      let receipt = await tx.wait();
      let gasCost = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);

      // Check SC, User balances after
      let userBalanceAfter = await provider.getBalance(buyer1.address);
      let scBalanceAfter = await provider.getBalance(hardhatEvent.address);

      expect(userBalanceAfter).to.equal(userBalanceBefore.sub(gasCost).add(overpay));
      expect(scBalanceAfter).to.equal(scBalanceBefore.sub(overpay));
    })

    it('user cannot withdraw money if did not overpay for ticket', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      const provider = ethers.provider;

      await hardhatEvent.connect(buyer1).buyTicket({ value: _price });
      await expect(hardhatEvent.connect(buyer1).withdraw()).to.be.reverted;
    })

    it('user cannot withdraw before buying ticket', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      const provider = ethers.provider;

      await expect(hardhatEvent.connect(buyer1).withdraw()).to.be.reverted;
    })

    it('user cannot withdraw money if user already withdraw all', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      const provider = ethers.provider;
      
      const overpay = 1;
      await hardhatEvent.connect(buyer1).buyTicket({ value: _price + overpay });
      await hardhatEvent.connect(buyer1).withdraw();

      await expect(hardhatEvent.connect(buyer1).withdraw()).to.be.reverted;
    })
      
    it('user can withdraw money in checkinOpen stage after ticket overpay', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      const provider = ethers.provider;
      const overpay = 1;
      await hardhatEvent.connect(buyer1).buyTicket({ value: _price + overpay });
      
      // Check SC, User balances before withdraw
      let userBalanceBefore = await provider.getBalance(buyer1.address);
      let scBalanceBefore = await provider.getBalance(hardhatEvent.address);

      // Withdraw
      await hardhatEvent.connect(owner).setStage(2);
      let tx = await hardhatEvent.connect(buyer1).withdraw();
      let receipt = await tx.wait();
      let gasCost = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);

      // Check SC, User balances after
      let userBalanceAfter = await provider.getBalance(buyer1.address);
      let scBalanceAfter = await provider.getBalance(hardhatEvent.address);

      expect(userBalanceAfter).to.equal(userBalanceBefore.sub(gasCost).add(overpay));
      expect(scBalanceAfter).to.equal(scBalanceBefore.sub(overpay));
    })
      
    it('user can withdraw money in closed stage after ticket overpay', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      const provider = ethers.provider;
      const overpay = 1;
      await hardhatEvent.connect(buyer1).buyTicket({ value: _price + overpay });
      
      // Check SC, User balances before withdraw
      let userBalanceBefore = await provider.getBalance(buyer1.address);
      let scBalanceBefore = await provider.getBalance(hardhatEvent.address);

      // Withdraw
      await hardhatEvent.connect(owner).setStage(4);
      let tx = await hardhatEvent.connect(buyer1).withdraw();
      let receipt = await tx.wait();
      let gasCost = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);

      // Check SC, User balances after
      let userBalanceAfter = await provider.getBalance(buyer1.address);
      let scBalanceAfter = await provider.getBalance(hardhatEvent.address);

      expect(userBalanceAfter).to.equal(userBalanceBefore.sub(gasCost).add(overpay));
      expect(scBalanceAfter).to.equal(scBalanceBefore.sub(overpay));
    })

    it('event emitted when user withdraws money', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      const provider = ethers.provider;

      // Overpay for ticket
      overpay = 1;
      await hardhatEvent.connect(buyer1).buyTicket({ value: _price + overpay });

      // Withdraw
      let tx = await hardhatEvent.connect(buyer1).withdraw();
      expect(tx).emit(hardhatEvent, "WithdrawMoney").withArgs(buyer1.address, overpay);
    })
  })

  describe('owner withdraw if event is not cancelled', async () => {
        
    // Owner cannot withdraw money if stage is not closed 
    it('owner cannot withdraw money if stage is not closed', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixture);

      // enum Stages { Prep, Active, CheckinOpen, Cancelled, Closed }
      await hardhatEvent.setStage(0);
      await expect(hardhatEvent.connect(owner).withdraw()).to.be.reverted;

      await hardhatEvent.setStage(1);
      await expect(hardhatEvent.connect(owner).withdraw()).to.be.reverted;

      await hardhatEvent.setStage(2);
      await expect(hardhatEvent.connect(owner).withdraw()).to.be.reverted;

      await hardhatEvent.setStage(3);
      await expect(hardhatEvent.connect(owner).withdraw()).to.be.reverted;
    })

    it('owner cannot withdraw money if no money in account', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixture);
      await hardhatEvent.setStage(4);

      await expect(hardhatEvent.connect(owner).withdraw()).to.be.reverted;
    })

    // Owner withdraw money after tickets purchased
    it('owner successfully withdraws money', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixture);
      const provider = ethers.provider;
      await hardhatEvent.setStage(1);

      // User buys ticket
      const overpay = 1;
      let tx1 = await hardhatEvent.connect(buyer1).buyTicket({ value: _price + overpay });
      let receipt1 = await tx1.wait();
      let gasCost1 = receipt1.cumulativeGasUsed.mul(receipt1.effectiveGasPrice);
      
      // Event closed
      await hardhatEvent.setStage(4);

      // Check SC, User balances before withdraw
      let userBalanceBefore = await provider.getBalance(buyer1.address);
      let scBalanceBefore = await provider.getBalance(hardhatEvent.address);

      // SC Withdraw
      let tx2 = await hardhatEvent.connect(owner).withdraw();
      let receipt2 = await tx2.wait();
      let gasCost2 = receipt2.cumulativeGasUsed.mul(receipt2.effectiveGasPrice);

      // Check SC, User balances after withdraw
      let userBalanceAfter = await provider.getBalance(buyer1.address);
      let scBalanceAfter = await provider.getBalance(hardhatEvent.address);

      expect(userBalanceAfter).to.equal(userBalanceAfter);
      expect(scBalanceAfter).to.equal(scBalanceBefore.sub(_price))
    })

    // Owner tries withdrawing twice
    it('owner cannot withdraw twice', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixture);
      await hardhatEvent.setStage(1);
      await hardhatEvent.connect(buyer1).buyTicket({ value: _price });

      // Event closed
      await hardhatEvent.setStage(4);

      // Owner withdraws twice
      await hardhatEvent.connect(owner).withdraw();
      await expect(hardhatEvent.connect(owner).withdraw()).to.be.reverted;
    })

    // Withdraw money emits event
    it('event emitted when owner withdraws money', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixture);
      const provider = ethers.provider;
      await hardhatEvent.setStage(1);
      await hardhatEvent.connect(buyer1).buyTicket({ value: _price });
      await hardhatEvent.setStage(4);

      // Withdraw
      let tx = await hardhatEvent.connect(owner).withdraw();
      expect(tx).emit(hardhatEvent, "OwnerWithdrawMoney").withArgs(owner.address, _price);
    })
  })
    
  // event cancelled case all go in here
  describe('event cancelled', async () => {

    it('owner withdraws money after event cancelled without royalty gain', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      
      // User buys ticket
      await hardhatEvent.connect(buyer1).buyTicket({ value: _price });

      // Event cancelled/closed
      await hardhatEvent.connect(owner).setStage(3);
      await hardhatEvent.connect(owner).setStage(4);

      // Check owner has no money to withdraw
      await expect(hardhatEvent.connect(owner).withdraw()).to.be.reverted;
    })
      
    it('user withdraw when event cancelled and with ticket overpay', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixtureSetStage);
      const provider = ethers.provider;

      // User buys ticket
      const overpay = 1;
      await hardhatEvent.connect(buyer1).buyTicket({ value: _price + overpay });

      // Event cancelled
      await hardhatEvent.connect(owner).setStage(3);
      
      // Check user and SC balance before and after withdraw
      let userBalanceBefore = await provider.getBalance(buyer1.address);
      let scBalanceBefore = await provider.getBalance(hardhatEvent.address);

      // Withdraw
      let tx = await hardhatEvent.connect(buyer1).withdraw();
      let receipt = await tx.wait();
      let gasCost = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);

      // Check user and SC balance before and after withdraw
      let userBalanceAfter = await provider.getBalance(buyer1.address);
      let scBalanceAfter = await provider.getBalance(hardhatEvent.address);

      expect(userBalanceAfter).to.equal(userBalanceBefore.sub(gasCost).add(overpay).add(_price));
      expect(scBalanceAfter).to.equal(scBalanceBefore.sub(overpay).sub(_price));
    })
      
    it('checking owner cannot withdraw money if stage is cancelled', async () => {
      const { Event, hardhatEvent, owner, buyer1 } = await loadFixture(deployEventFixture);
      await hardhatEvent.setStage(1);
      await hardhatEvent.connect(buyer1).buyTicket({ value: _price });

      // Event cancelled
      await hardhatEvent.setStage(3);

      // Check owner has no money to withdraw
      await expect(hardhatEvent.connect(owner).withdraw()).to.be.reverted;
    })  
  })
})

// Event Creator testing
describe('EventCreator', (accounts) => {
  // Deploy EventCreator
  async function deployEventCreatorFixture() {
    // Get the ContractFactory and Signers here.
    const EventCreator = await ethers.getContractFactory("EventCreator");
    const [owner, buyer1, buyer2] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    const hardhatEventCreator = await EventCreator.deploy();

    await hardhatEventCreator.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { EventCreator, hardhatEventCreator, owner, buyer1, buyer2 };
  }

  // Variables for creating the Event Contract
  let eventCreator
  const _numTickets = 5
  const _price = 50
  const _canBeResold = true
  const _royaltyPercent = 20
  const _eventName = 'EventName'
  const _eventSymbol = 'EventSymbol'

  // Event Creator contract deployment
  describe("Deployment", function () {
    it("Should deploy correctly", async function () {
      const { hardhatEventCreator, owner } = await loadFixture(deployEventCreatorFixture);

      expect(await hardhatEventCreator.address).to.not.equal('');
      expect(await hardhatEventCreator.address).to.not.equal(0x0);
      expect(await hardhatEventCreator.address).to.not.equal(null);
      expect(await hardhatEventCreator.address).to.not.equal(undefined);
    });
  });

  // Create new event
  describe('create event', async () => {
    it('Create event success', async () => {
      const { hardhatEventCreator, owner, buyer1, buyer2 } = await loadFixture(deployEventCreatorFixture);

      const address = await hardhatEventCreator.createEvent(_numTickets, _price, _canBeResold, _royaltyPercent, _eventName, _eventSymbol)
      expect(address).to.not.equal('');
      expect(address).to.not.equal(0x0);
      expect(address).to.not.equal(null);
      expect(address).to.not.equal(undefined);
    })

    // emitEvent
    it('Checking createEvent success, address added to events list matches emitted event address', async () => {
      const { hardhatEventCreator, owner, buyer1, buyer2 } = await loadFixture(deployEventCreatorFixture);

      const event = await hardhatEventCreator.createEvent(_numTickets, _price, _canBeResold, _royaltyPercent, _eventName, _eventSymbol)
      expect(event).emit(hardhatEventCreator, "CreateEvent").withArgs(buyer1.address, event.address)
    })

    // it('getEvents returns list of event addresses', async () => {
    //     const { hardhatEventCreator, owner, buyer1, buyer2 } = await loadFixture(deployEventCreatorFixture);
    //     console.log("Owner: ", owner)
    //     console.log("Buyer1: ", buyer1)
    //     console.log("Buyer2: ", buyer2)

    //     const event1 = await hardhatEventCreator.createEvent(_numTickets, _price, _canBeResold, _royaltyPercent, _eventName, _eventSymbol)
    //     const event2 = await hardhatEventCreator.createEvent(_numTickets, _price, _canBeResold, _royaltyPercent, _eventName, _eventSymbol)
    //     console.log("Event 1: ", event1)
    //     console.log("event 2: ", event2)

    //     let events = await hardhatEventCreator.getEvents()
    //     console.log("Events: ", events)
    //     console.log("Event[0]: ", events[0])
    //     console.log("Event[1]: ", events[1])
    //     expect(events.length).to.equal(2)
    //     expect(events[0]).to.equal(event1)
    //     expect(events[1]).to.equal(event2)
    // })
  })
})