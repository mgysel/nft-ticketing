import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import EventArtifact from "../contracts/Event.json";
import EventCreatorArtifact from "../contracts/EventCreator.json";
import contractAddress from "../contracts/contract-address.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "./error_handling/NoWalletDetected";
import { ConnectWallet } from "./error_handling/ConnectWallet";
import { Loading } from "./error_handling/Loading";
import { TransactionErrorMessage } from "./error_handling/TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./error_handling/WaitingForTransactionMessage";
import { Navbar } from "./navbar/Navbar";

// Routes
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Event Tabs
import { EventOrganizer } from "./event_organizer/EventOrganizer.js";
import { Attendee } from "./attendee/Attendee.js";
import { Balance } from "./balance/Balance.js";

import {
  Flex,
} from "@chakra-ui/react";

// This is the default id used by the Hardhat Network
const HARDHAT_NETWORK_ID = '31337';

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes ethers and the Token contract
//   3. Polls the user balance to keep it updated.
//   4. Transfers tokens by sending transactions
//   5. Renders the whole application
//
// Note that (3) and (4) are specific of this sample application, but they show
// you how to keep your Dapp and contract's state in sync,  and how to send a
// transaction.
export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    // We store multiple things in Dapp's state.
    // You don't need to follow this pattern, but it's an useful example.
    this.initialState = {
      // The user's address and balance
      selectedAddress: undefined,
      balance: undefined,
      provider: undefined,
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      // Events
      myEvents: [],
      events: [],
      eventStage: 0,
      // Set ticket to used
      usedTicketID: -1,
      // Reselling tickets
      resalePrice: 0,
      resaleTicketID: -1,
      // Styling
      darkGreen: "#276749",
      lightGreen: "#C6F6DF",
      navLinkHoverColor: 'gray.400',
      // Tickets
      hasEvents: false,
      hasTickets: false,
      hasTicketsEntry: false,
      hasSecondaryTickets: false,
    };

    this.state = this.initialState;
    
    // Binding setState to this
    this.setState = this.setState.bind(this);
  }

  render() {
    // Ethereum wallets inject the window.ethereum object. If it hasn't been
    // injected, we instruct the user to install a wallet.
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    // The next thing we need to do, is to ask the user to connect their wallet.
    // When the wallet gets connected, we are going to save the users's address
    // in the component's state. So, if it hasn't been saved yet, we have
    // to show the ConnectWallet component.
    //
    // Note that we pass it a callback that is going to be called when the user
    // clicks a button. This callback just calls the _connectWallet method.
    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet 
          connectWallet={() => this._connectWallet()} 
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    // If the token data or the user's balance hasn't loaded yet, we show
    // a loading component.
    if (!this.state.balance) {
      return <Loading />;
    }

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <div>
          <Flex w="90%" my="20px" 
            ml="5%"
            mr="5%"
            direction="column"
          >
            <Navbar state={this.state} setState={this.setState} />
            <Routes>
              <Route path="/" element={
                <Attendee
                  state={this.state} 
                  setState={this.setState} 
                  dismissTransactionError={this.dismissTransactionError}
                  eventCreator={this.eventCreator}
                  updateBalance={this.updateBalance}
                  getEventsData={this.getEventsData}
                />
              }/>
              <Route path="/event-organizers" element={
                <EventOrganizer 
                  state={this.state} 
                  setState={this.setState} 
                  dismissTransactionError={this.dismissTransactionError}
                  eventCreator={this.eventCreator}
                  updateBalance={this.updateBalance}
                  getEventsData={this.getEventsData}
                />
              }/>
              <Route path="/balance" element={
                <Balance 
                  state={this.state} 
                  setState={this.setState} 
                  dismissTransactionError={this.dismissTransactionError}
                  eventCreator={this.eventCreator}
                  updateBalance={this.updateBalance}
                  getEventsData={this.getEventsData}
                />
              }/>
            </Routes>
          </Flex>
        </div>
      </div>
    );
  }

  componentWillUnmount() {
    // We poll the user's balance, so we have to stop doing that when Dapp
    // gets unmounted
    this._stopPollingData();
  }

  async _connectWallet() {
    console.log("*** Inside connectWallet")
    // This method is run when the user clicks the Connect. It connects the
    // dapp to the user's wallet, and initializes it.

    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Once we have the address, we can initialize the application.

    // First we check the network
    this._checkNetwork();

    this._initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state 
      if (newAddress === undefined) {
        return this._resetState();
      }
      
      this._initialize(newAddress);
    });
  }

  async _initialize(userAddress) {
    // This method initializes the dapp

    // We first store the user's address in the component's state
    console.log("*** Inside initialize");
    console.log("User address: ", userAddress);
    console.log("Selected Address BEFORE: ", this.state.selectedAddress);

    this.setState({ 
      selectedAddress: userAddress,
      provider: new ethers.providers.Web3Provider(window.ethereum),
    }, function() {
      console.log("Selected Address AFTER: ", this.state.selectedAddress);
      this.initializeEthers();
      this.updateBalance();
      this.getEventsData();
      // this._startPollingData();
    });

    // Then, we initialize ethers, fetch the token's data, and start polling
    // for the user's balance.

    // Fetching the token data and the user's balance are specific to this
    // sample project, but you can reuse the same initialization pattern.
    // await this.initializeEthers();
    // await this.updateBalance();
    // await this.getEventsData();
    // this._startPollingData();
  }

  async initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    console.log("*** Inside initializeEthers")

    // Initialize the Event Creator contract
    this.eventCreator = new ethers.Contract(
      // TODO: How to get Event Creator address
      contractAddress.EventCreator,
      EventCreatorArtifact.abi,
      this.state.provider.getSigner(0)
    );
  }

  // The next two methods just read from the contract and store the results
  // in the component state.
  async updateBalance() {
    console.log("*** Inside updateBalance");
    const balance = ethers.utils.formatEther(await this.state.provider.getBalance(this.state.selectedAddress));
    this.setState({ balance: balance });
  }

  async getEventsData() {
    console.log("*** Inside getEventsData");
    const events = await this.eventCreator.getEvents();
    const eventsData = [];
    for (let i=0; i < events.length; i++) {
      // Upload event contract
      const thisEvent = new ethers.Contract(
        events[i],
        EventArtifact.abi,
        this.state.provider.getSigner(0)
      );
      // Get event data
      let contractAddress = events[i];
      let owner = await thisEvent.owner();
      let ownerBalance = ethers.utils.formatEther((await thisEvent.balances(owner)).toString());
      let userBalance = ethers.utils.formatEther((await thisEvent.balances(this.state.selectedAddress)).toString());
      let name = await thisEvent.name();
      let symbol = await thisEvent.symbol();
      let numTicketsLeft = (await thisEvent.numTicketsLeft()).toNumber();
      let price = (await thisEvent.price()).toNumber();
      let canBeResold = await thisEvent.canBeResold();
      let royaltyPercent = (await thisEvent.royaltyPercent()).toNumber();
      let stage = await thisEvent.stage();
      let myTickets = (await thisEvent.balanceOf(this.state.selectedAddress)).toNumber();
      let numTicketsSold = (await thisEvent.numTickets()).toNumber() - (await thisEvent.numTicketsLeft()).toNumber();
      // Get my/all tickets
      let myTicketsID = [];
      let tickets = [];
      let secondaryTickets = [];
      for (let j=0; j < numTicketsSold; j++) {
        await thisEvent.tickets(j).then((ticket) => {
          tickets.push({
            "ticketID": j,
            "resalePrice": ticket.resalePrice.toNumber(),
            "status": ticket.status,
          });
          if (ticket.status === 2) {
            secondaryTickets.push({
              "ticketID": j,
              "resalePrice": ticket.resalePrice.toNumber(),
              "status": ticket.status,
            });
          }
        })
        await thisEvent.ownerOf(j).then(() => {
          myTicketsID.push(j);
        })
      }
      // Get registered buyers for each ticket 
      for (let j=0; j < tickets.length; j++) {
        await thisEvent.registeredBuyers(tickets[j].ticketID).then((buyers) => {
          tickets[j].registeredBuyers = buyers;
        })
      }
      if (myTickets > 0) {
        this.setState({
          hasTickets: true,
        })
      }
      if (secondaryTickets.length > 0) {
        this.setState({
          hasSecondaryTickets: true,
        })
      }
      if (myTickets > 0 && stage === 2) {
        this.setState({
          hasTicketsEntry: true,
        })
      }
      if (owner.toLowerCase() === this.state.selectedAddress.toLowerCase()) {
        this.setState({
          hasEvents: true,
        })
      } 

      // Create event data object
      let thisEventData = {
        "contract": thisEvent,
        "contractAddress": contractAddress,
        "owner": owner,
        "ownerBalance": ownerBalance,
        "userBalance": userBalance,
        "name": name,
        "symbol": symbol,
        "numTicketsLeft": numTicketsLeft,
        "price": price,
        "canBeResold": canBeResold,
        "royaltyPercent": royaltyPercent,
        "stage": stage,
        "myTicketsNum": myTickets,
        "myTicketsID": myTicketsID,
        "secondaryTickets": secondaryTickets,
        "tickets": tickets,
      }
      eventsData.push(thisEventData);
    }

    // Determine if user has tickets


    console.log("EVENTS DATA: ", eventsData);
    this.setState({events: eventsData});
    console.log("STATE EVENTS DATA: ", this.state.events)
  }


  // The next two methods are needed to start and stop polling data. While
  // the data being polled here is specific to this example, you can use this
  // pattern to read any data from your contracts.
  //
  // Note that if you don't need it to update in near real time, you probably
  // don't need to poll it. If that's the case, you can just fetch it when you
  // initialize the app, as we do with the token data.
  _startPollingData() {
    this._pollDataInterval = setInterval(() => this.updateBalance(), 1000);
    this._pollEventsInterval = setInterval(() => this.getEventsData(), 1000);

    // We run it once immediately so we don't have to wait for it
    this.updateBalance();
    this.getEventsData();
  }

  _stopPollingData() {
    // clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  // This method just clears part of the state.
  dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  async _switchChain() {
    const chainIdHex = `0x${HARDHAT_NETWORK_ID.toString(16)}`
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    await this._initialize(this.state.selectedAddress);
  }

  // This method checks if the selected network is Localhost:8545
  _checkNetwork() {
    if (window.ethereum.networkVersion !== HARDHAT_NETWORK_ID) {
      this._switchChain();
    }
  }
}
