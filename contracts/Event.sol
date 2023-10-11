// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Factory Contract to create events
contract EventCreator {

    // Created events
    Event[] public events;

    // EVENTS
    event CreateEvent(address _creator, address _event);

    /**
     * @notice Creates Events
     * @param _numTickets Number of tickets 
     * @param _price Price per ticket
     * @param _canBeResold Are tickets allowed to be resold
     * @param _royaltyPercent Royalty percentage accrued by organizers on reselling of ticket
     * @param _eventName Name of the Ticket NFT
     * @param _eventSymbol Symbol for the Ticket NFT Token
     */
    function createEvent(uint _numTickets, uint _price, bool _canBeResold, uint _royaltyPercent,
            string memory _eventName, string memory _eventSymbol) external returns(address newEvent) {

        // Create a new Event smart contract
        Event e = new Event(msg.sender, _numTickets, _price, _canBeResold, _royaltyPercent, _eventName, _eventSymbol);
        events.push(e);

        // Store/return event address
        emit CreateEvent(msg.sender, address(e));

        return address(e);
    }

    // Returns array of all events
    function getEvents() external view returns(Event[] memory _events) {
        _events = new Event[] (events.length);
        for (uint i=0; i<events.length; i++){
            _events[i] = events[i];
        }

        return _events;
    }
}

/// @title Contract to mint tickets of an event
contract Event is ERC721 {
    /// Control Event Status at a granular level
    enum Stages { Prep, Active, CheckinOpen, Cancelled, Closed }
    // Stages public stage = Stages.Prep;
    Stages public stage;
    /// Control Ticket Status at a granular level
    /// Valid - Ticket is Valid
    /// Used - Ticket is used
    /// AvailableForSale - Ticket is allowed to be sold to someone
    enum TicketStatus { Valid, Used, AvailableForSale }
    
    // Ticket struct 
    struct Ticket {
        uint resalePrice;
        TicketStatus status;
    }
    
    // array to store tickets, index will be ticketID
    Ticket[] public tickets;
    
    // ticket original price
    uint public price;
    
    // Percent royalty event creator receives from ticket resales
    uint public royaltyPercent;
    
    // number of tickets left to sell
    uint256 public numTicketsLeft;
    
    // if ticket can be resold in the second market
    bool public canBeResold;
    
    // if event is cancelled
    bool public isCancelled;
    
    // orginizer of event
    address payable public owner;
    
    // to store the balances for buyers and organizers
    mapping(address => uint) public balances;
    mapping(address => bool) public isUserRefund;
    mapping(uint => address) public registeredBuyers;

    // EVENTS
    event CreateTicket(address contractAddress, string eventName, address buyer, uint ticketID);
    event WithdrawMoney(address receiver, uint money);
    event OwnerWithdrawMoney(address owner, uint money);
    event TicketForSale(address seller, uint ticketID);
    event TicketSold(address contractAddress, string eventName, address buyer, uint ticketID);
    event TicketUsed(address contractAddress, uint ticketID, string eventName, string sQRCodeKey);

    // Creates a new Event Contract
    constructor(address _owner, uint _numTickets, uint _price, bool _canBeResold, uint _royaltyPercent,
            string memory _eventName, string memory _eventSymbol) ERC721(_eventName, _eventSymbol) {    
        // Check valid constructor arguments
        require(_royaltyPercent >= 0 && _royaltyPercent <= 100, "");
        // Number of tickets must be greater than 0
        require(_numTickets > 0, "");
        
        owner = payable(_owner);
        numTicketsLeft = _numTickets;
        price = _price;
        canBeResold = _canBeResold;
        royaltyPercent = _royaltyPercent;
        stage = Stages.Prep;
    }

    /**
     * @notice Buy tickets
     * @dev Checks: State is Active, has enough money
     */
    function buyTicket() public payable requiredStage(Stages.Active) {
        require(numTicketsLeft > 0, "");
        require(msg.value >= price, "");
        
        // Create Ticket t, Store t in tickets array
        tickets.push(Ticket(price, TicketStatus.Valid));
        uint ticketID = tickets.length - 1;
        numTicketsLeft--;
        
        // store overpaid in balances
        if (msg.value > price) {
            uint amount = msg.value - price;
            balances[msg.sender] += amount;
        }
        balances[owner] += price;
        
        // Mint NFT
        _safeMint(msg.sender, ticketID);
        emit CreateTicket(address(this), name(), msg.sender, ticketID);
    }

    /**
     * @notice Mark ticket as used
     * @dev Only a valid buyer can mark ticket as used
     * @param ticketID ticket ID of ticket
     */
    function buyTicketFromUser(uint ticketID) public payable requiredStage(Stages.Active) {
        // Check if ticket is available for sale
        require(tickets[ticketID].status == TicketStatus.AvailableForSale, "");

        // calc amount to pay after royalty
        uint ticketPrice = tickets[ticketID].resalePrice;
        // store overpaid in balances
        if (msg.value > ticketPrice) {
            uint amount = msg.value - ticketPrice;
            balances[msg.sender] += amount;
        }
        uint royalty = (royaltyPercent * ticketPrice) / 100;
        uint priceToPay = ticketPrice - royalty;

        address payable seller = payable(ownerOf(ticketID));
        // store balances for seller and owner to withdraw later
        balances[seller] += priceToPay;
        balances[owner] += royalty;
        
        emit TicketSold(address(this), name(), msg.sender, ticketID);
        safeTransferFrom(seller, msg.sender, ticketID);

        tickets[ticketID].status = TicketStatus.Valid;
    }
    
    /**
     * @notice Mark ticket as used
     * @dev Only a valid buyer can mark ticket as used
     * @param ticketID ticket ID of ticket
     * @param sQRCodeKey QR Code key sent by the app 
     */
    function setTicketToUsed(uint ticketID, string memory sQRCodeKey) public requiredStage(Stages.CheckinOpen)
                                                                    ownsTicket(ticketID) {
		// Validate that user has a ticket they own and it is valid
        require(tickets[ticketID].status == TicketStatus.Valid, "");
    
        // Ticket is valid so mark it as used
        tickets[ticketID].status = TicketStatus.Used;

        // Burn the Token
        _burn(ticketID); 
        
        // Raise event which Gate Management system can consume then
        emit TicketUsed(address(this), ticketID, name(), sQRCodeKey);
	}

    /**
     * @notice Mark ticket as used
     * @dev Only a valid buyer can mark ticket as used
     * @param ticketID ticket ID of ticket
     * @param resalePrice resale price for ticket
     */
    function setTicketForSale(uint ticketID, uint resalePrice) public requiredStage(Stages.Active) ownsTicket(ticketID) {
		// Validate that user has a ticket they own and it is valid
        require(tickets[ticketID].status != TicketStatus.Used, "");
        require(canBeResold == true, "");
        
        // Ticket is valid so mark it for sale
        tickets[ticketID].status = TicketStatus.AvailableForSale;
        tickets[ticketID].resalePrice = resalePrice;
        
        // Raise event which Gate Management system can consume then
        emit TicketForSale(msg.sender, ticketID);
	}

    /**
     * @notice User to withdraw money 
     * @dev User can withdraw money if event cancelled or overpaid for ticket
     */
    function withdraw() public {
        if (msg.sender != owner) {
            // Amount to send to user
            uint sendToUser = balances[msg.sender];
            
            // If event cancelled, send user the amount they overpaid for ticket + ticket price refund
            if (stage == Stages.Cancelled && isUserRefund[msg.sender] == false ) {
                sendToUser += balanceOf(msg.sender) * price;
            }

            // Cannot withdraw if no money to withdraw
            require(sendToUser > 0, "");
            
            // Update balance before transfering money
            balances[msg.sender] = 0;
            isUserRefund[msg.sender] = true;

            // Transfer money to user
            address payable receiver = payable(msg.sender);
            // Call will forwards all available gas
            (bool sent, ) = receiver.call{value:sendToUser}("");
            // Failure condition of send will emit this error
            require(sent, "");
            emit WithdrawMoney(msg.sender, sendToUser);
        } else {
            // Owner
            require(stage == Stages.Closed, "");
            uint ownerBalance = balances[owner];
            require(ownerBalance > 0, "");
            
            // Update balance before transfering money
            balances[owner] = 0;

            // Call will forwards all available gas
            (bool sent, ) = msg.sender.call{value:ownerBalance}("");
            // Failure condition if cannot transfer
            require(sent, "");
            emit OwnerWithdrawMoney(msg.sender, ownerBalance);
        }
        
    }

    /**
     * @dev approve a buyer to buy ticket of another user
     */
    function approveAsBuyer(address buyer, uint ticketID) public requiredStage(Stages.Active){
        require(ownerOf(ticketID) == msg.sender, "");
        setApprovalForAll(buyer, bool(true));
        approve(buyer, ticketID);
    }

    /**
     * @dev register as buyer
     */
    function registerAsBuyer(uint ticketID) public requiredStage(Stages.Active){
        require(registeredBuyers[ticketID] != msg.sender, "");

        registeredBuyers[ticketID] = msg.sender;
    }
    
    /** 
     * @notice Change Status
     * @dev Only owner can change state
     * @param _stage Stages as set in enum Stages
     */
    function setStage(Stages _stage) public onlyOwner returns (Stages) {
        stage = _stage;
        if (stage == Stages.Cancelled) {
            isCancelled = true;
            balances[owner] -= price * tickets.length;
        }
        return stage;
    }


    // MODIFIERS
    // Only owner
    modifier onlyOwner() {
        require(msg.sender == owner, "");
        _;
    }

    // Requires stage to be _stage
    modifier requiredStage(Stages _stage) {
        require(stage == _stage, "");
        _;
    }

    // Check if user is ticket owner
    modifier ownsTicket(uint ticketID) {
        require(ownerOf(ticketID) == msg.sender, "");
        _;
    }
}