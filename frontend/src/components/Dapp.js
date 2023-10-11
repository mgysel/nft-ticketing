import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import TokenArtifact from "../contracts/Token.json";
import EventArtifact from "../contracts/Event.json";
import EventCreatorArtifact from "../contracts/EventCreator.json";
import contractAddress from "../contracts/contract-address.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Transfer } from "./Transfer";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoTokensMessage } from "./NoTokensMessage";
import { Landing } from "./Landing";

import {
  Heading,
  Flex,
  Center,
  Wrap,
  WrapItem,
  Button,
  Text,
  Form,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  IconButton,
  Icon,
  Input,
  InputGroup,
  SimpleGrid,
  Box,
  VStack,
  Stack,
  Radio,
  RadioGroup,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
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
      // The info of the token (i.e. It's Name and symbol)
      tokenData: undefined,
      // The user's address and balance
      selectedAddress: undefined,
      balance: undefined,
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      // Create Event Form
      formEventName: "",
      formEventSymbol: "",
      formNumTickets: 0,
      formPrice: 0,
      formCanBeResold: true,
      formRoyaltyPercent: 0,
      // Styling
      darkGreen: "#276749",
      lightGreen: "#C6F6DF",
      // Events
      myEvents: [],
      eventStage: 0,
      sRandomHash: "",
      resalePrice: 0,

    };

    this.state = this.initialState;
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
    if (!this.state.tokenData || !this.state.balance) {
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
            <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
              <Heading ml={20} color="white">
                TicketChain
              </Heading>
              <VStack spacing={2} alignItems="right">
                <Box className="navbar-brand pb-0 mb-0" justify="right">
                  Account: {this.state.selectedAddress.toString()}
                </Box>
                <Box className="navbar-brand pt-0 mt-0" justify="right">
                  Balance: {this.state.balance.toString()}
                </Box>
              </VStack>
            </nav>
            <Tabs 
              mt="100px"
              p="20px"
              variant="soft-rounded"
              colorScheme="green"
              borderRadius="5px"
              border="1px solid"
              borderColor="gray.200"
            >
              <TabList>
                  <Tab>
                    Create Events
                  </Tab>
                  <Tab>
                    Purchase Tickets
                  </Tab>
                  <Tab>
                    My Tickets
                  </Tab>
                  <Tab>
                    My Events
                  </Tab>
                </TabList>
                <TabPanels>
                <TabPanel mt="15px" mb="15px" align="center">
                  <Stack width="600px" align="center" justify="center">
                    <Heading mb="25px">Create an Event Now</Heading>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          this._createEvent(
                            this.state.formNumTickets, 
                            this.state.formPrice, 
                            this.state.formCanBeResold, 
                            this.state.formRoyaltyPercent, 
                            this.state.formEventName, 
                            this.state.formEventSymbol
                          )
                        }}
                      >
                        <Input
                          isRequired
                          id='name'
                          type='text'
                          size="md"
                          placeholder='Event name'
                          onChange={(e) => this.setState({ formEventName: e.target.value })}
                          mb="10px"
                          _placeholder={{ color: 'gray.500' }}
                          w="450px"
                        />
                        <Input
                          isRequired
                          id='symbol'
                          type='text'
                          size="md"
                          placeholder='Token symbol'
                          onChange={(e) => this.setState({ formEventSymbol: e.target.value })}
                          mb="10px"
                          _placeholder={{ color: 'gray.500' }}
                          w="450px"
                        />
                        <Input
                          isRequired
                          id='numTickets'
                          type='number'
                          size="md"
                          placeholder='Number of Tickets'
                          onChange={(e) => this.setState({ formNumTickets: e.target.value })}
                          mb="10px"
                          _placeholder={{ color: 'gray.500' }}
                          w="450px"
                        />
                        <Input
                          isRequired
                          id='price'
                          type='number'
                          size="md"
                          placeholder='Price'
                          onChange={(e) => this.setState({ formEventPrice: e.target.value })}
                          mb="10px"
                          _placeholder={{ color: 'gray.500' }}
                          w="450px"
                        />
                        <RadioGroup 
                          mb="10px"
                          _placeholder={{ color: 'gray.500' }}
                          w="450px"
                          h="40px"
                          onChange={(e) => this.setState({ formCanBeResold: e.target.value })}
                          value={this.state.formCanBeResold}
                          border="1px"
                          borderRadius="5px"
                          borderColor='gray.200'
                          textAlign=""
                        >
                          <Stack spacing={4} direction="row">
                            <FormLabel 
                              color='gray.500' 
                              verticalAlign='middle'
                              ml="15px"
                              mt="6px"
                            >
                              Can tickets be resold?
                            </FormLabel>
                            <Radio value={true}>Yes</Radio>
                            <Radio value={false}>No</Radio>
                          </Stack>
                        </RadioGroup>
                        <Input
                          isRequired
                          id='royaltyPercent'
                          type='number'
                          size="md"
                          placeholder='Resale royalty (%)'
                          onChange={(e) => this.setState({ formRoyaltyPercent: e.target.value })}
                          mb="10px"
                          _placeholder={{ color: 'gray.500' }}
                          w="450px"
                        />
                      <Button 
                        type='submit' 
                        color={this.state.darkGreen}
                        backgroundColor={this.state.lightGreen}
                        size="lg"
                        mt="10px"
                      >
                          CREATE EVENT
                      </Button>
                    </form>
                  </Stack>
                </TabPanel>
                <TabPanel mt="15px" mb="15px" align="center">
                  <Heading mb="25px">Purchase Tickets</Heading>
                  <SimpleGrid columns={4} spacing={10} mt="30px">
                    { 
                      this.state.events.map((id, index) => (
                          id.stage !== 0 && id.stage !== 2 && id.stage !== 5 && (
                            <Box key={index}        
                              borderRadius="5px"
                              border="1px solid"
                              borderColor="gray.200"
                              p="20px" 
                              width="20rem"
                            >
                              <Text isTruncated fontWeight="bold" fontSize="xl" mb="7px"> Event {index + 1}</Text>
                              <Text>Name: {id.eventName}</Text>
                              <Text>Symbol: {id.eventSymbol}</Text>
                              <Text>Number of Tickets: {id.numTicketsLeft}</Text>
                              <Text>Price: {id.price}</Text>
                              <Text>Can Be Resold?: {id.canBeResold.toString()}</Text>
                              <Text>Royalty Percent: {id.royaltyPercent}</Text>
                              <Text>Stage: {id.stage}</Text>
                              <Button 
                                type='submit' 
                                color={this.state.darkGreen}
                                backgroundColor={this.state.lightGreen}
                                size="lg"
                                mt="13px"
                                onClick={(e) => {
                                  e.preventDefault()
                                  this._buyTicket(index)
                                }}
                              >
                                  Buy Ticket
                              </Button>
                            </Box>
                          )
                      ))
                    }
                  </SimpleGrid>
                </TabPanel>
                <TabPanel mt="15px" mb="15px" align="center">
                  <Heading mb="25px">My Tickets</Heading>
                  <SimpleGrid columns={4} spacing={10} mt="30px">
                    { 
                      this.state.events.map((event, index) => (
                        event.myTickets > 0 && 
                          <Box 
                            key={index}
                            borderRadius="5px"
                            border="1px solid"
                            borderColor="gray.200"
                            p="20px"
                            width="20rem"
                          >
                            <Text isTruncated fontWeight="bold" fontSize="xl" mb="7px">Ticket for Event {event.eventName}</Text>
                            <Text>Event: {event.eventName}</Text>
                            <Text>Ticket ID: {event.ticketID}</Text>
                            <Box                       
                              borderRadius="5px"
                              border="1px solid"
                              borderColor="gray.100"
                              padding="10px"
                              mt="10px"
                            >
                              <form>
                                <Input
                                  isRequired
                                  id='eventStage'
                                  type='number'
                                  size="md"
                                  placeholder='Set Random Number'
                                  onChange={(e) => this.state.set({ "sRandomHash": e.target.value})}
                                  mb="0px"
                                  mt="10px"
                                  _placeholder={{ color: 'gray.500' }}
                                />
                                <Button 
                                  type='submit' 
                                  color={this.state.darkGreen}
                                  backgroundColor={this.state.lightGreen}
                                  size="lg"
                                  mt="10px"
                                  width="210px"
                                >
                                  Checkin
                                </Button>
                              </form>
                            </Box>
                            <Box                       
                              borderRadius="5px"
                              border="1px solid"
                              borderColor="gray.100"
                              padding="10px"
                              mt="10px"
                            >
                              <form>
                                <Input
                                  isRequired
                                  id='resalePrice'
                                  type='number'
                                  size="md"
                                  placeholder='Set Resale Price'
                                  onChange={(e) => this.state.set({"resalePrice": e.target.value})}
                                  mb="0px"
                                  mt="10px"
                                  _placeholder={{ color: 'gray.500' }}
                                />
                                <Button 
                                  type='submit' 
                                  color={this.state.darkGreen}
                                  backgroundColor={this.state.lightGreen}
                                  size="lg"
                                  mt="10px"
                                  width="210px"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    this._setTicketForSale(index)
                                  }}
                                >
                                  Set Ticket For Sale
                                </Button>
                              </form>
                            </Box>
                            <Button 
                              type='submit' 
                              color={this.state.darkGreen}
                              backgroundColor={this.state.lightGreen}
                              size="lg"
                              mt="10px"
                              width="210px"
                            >
                              Withdraw Balance
                            </Button>
                          </Box>
                      ))
                    }
                  </SimpleGrid>
              </TabPanel>
                <TabPanel mt="15px" mb="15px" align="center">
                  <Heading mb="25px">My Events</Heading>
                  <SimpleGrid columns={4} spacing={10} mt="30px">
                    { 
                      this.state.events.map((event, index) => (
                        <Box 
                          key={index} 
                          borderRadius="5px"
                          border="1px solid"
                          borderColor="gray.200"
                          p="20px" 
                          width="20rem"
                        >
                          <Text isTruncated fontWeight="bold" fontSize="xl" mb="7px"> Event {index + 1}</Text>
                          <Text>Event: {event.name}</Text>
                          <Text>Balance: {event.ownerBalance}</Text>
                          <Text>Number of Tickets Left: {event.numTicketsLeft}</Text>
                          <Box                       
                            borderRadius="5px"
                            border="1px solid"
                            borderColor="gray.100"
                            padding="10px"
                            mt="10px"
                          >
                            <RadioGroup 
                              mb="10px"
                              onChange={(e) => {
                                event.stage = e;
                                this.setState({eventStage: e});
                              }} 
                              value={event.stage.toString() == this.state.eventStage ? this.state.eventStage : event.stage.toString()}
                              defaultValue={event.stage.toString()}
                            >
                              <Stack spacing={4} direction="column">
                                <Radio value="0" mb="0">Prep</Radio>
                                <Radio value="1">Active</Radio>
                                <Radio value="2">Paused</Radio>
                                <Radio value="3">Checkin Open</Radio>
                                <Radio value="4">Cancelled</Radio>
                                <Radio value="5">Closed</Radio>
                              </Stack>
                            </RadioGroup>
                            <Button 
                              type='submit' 
                              color={this.state.darkGreen}
                              backgroundColor={this.state.lightGreen}
                              size="lg"
                              mt="10px"
                              width="210px"
                              onClick={(e) => {
                                e.preventDefault()
                                this._setEventStage(index)
                              }}
                            >
                              Set Event Stage
                            </Button>
                          </Box>
                          <Button 
                              type='submit' 
                              color={this.state.darkGreen}
                              backgroundColor={this.state.lightGreen}
                              size="lg"
                              mt="10px"
                              width="210px"
                            >
                              Owner Withdraw
                            </Button>
                        </Box>
                      ))
                    }
                  </SimpleGrid>
              </TabPanel>
              </TabPanels>
            </Tabs>
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

  _initialize(userAddress) {
    // This method initializes the dapp

    // We first store the user's address in the component's state
    this.setState({
      selectedAddress: userAddress,
    });

    // Then, we initialize ethers, fetch the token's data, and start polling
    // for the user's balance.

    // Fetching the token data and the user's balance are specific to this
    // sample project, but you can reuse the same initialization pattern.
    this._initializeEthers();
    this._getTokenData();
    this._startPollingData();
    console.log("GETTING EVENT DATA");
    this._getEventsData();
  }

  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    // Then, we initialize the contract using that provider and the token's
    // artifact. You can do this same thing with your contracts.
    this._token = new ethers.Contract(
      contractAddress.Token,
      TokenArtifact.abi,
      this._provider.getSigner(0)
    );

    // Initialize the Event Creator contract
    this._eventCreator = new ethers.Contract(
      // TODO: How to get Event Creator address
      contractAddress.EventCreator,
      EventCreatorArtifact.abi,
      this._provider.getSigner(0)
    );

    // Initialize the Event contract
    this._event = new ethers.Contract(
      contractAddress.Event,
      EventArtifact.abi,
      this._provider.getSigner(0)
    );
  }

  // The next two methods are needed to start and stop polling data. While
  // the data being polled here is specific to this example, you can use this
  // pattern to read any data from your contracts.
  //
  // Note that if you don't need it to update in near real time, you probably
  // don't need to poll it. If that's the case, you can just fetch it when you
  // initialize the app, as we do with the token data.
  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 1000);

    // We run it once immediately so we don't have to wait for it
    this._updateBalance();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  // The next two methods just read from the contract and store the results
  // in the component state.
  async _getTokenData() {
    const name = await this._token.name();
    const symbol = await this._token.symbol();

    this.setState({ tokenData: { name, symbol } });
  }

  async _updateBalance() {
    const balance = await this._token.balanceOf(this.state.selectedAddress);
    this.setState({ balance });
  }

  // This method sends an ethereum transaction to transfer tokens.
  // While this action is specific to this application, it illustrates how to
  // send a transaction.
  async _transferTokens(to, amount) {
    // Sending a transaction is a complex operation:
    //   - The user can reject it
    //   - It can fail before reaching the ethereum network (i.e. if the user
    //     doesn't have ETH for paying for the tx's gas)
    //   - It has to be mined, so it isn't immediately confirmed.
    //     Note that some testing networks, like Hardhat Network, do mine
    //     transactions immediately, but your dapp should be prepared for
    //     other networks.
    //   - It can fail once mined.
    //
    // This method handles all of those things, so keep reading to learn how to
    // do it.

    try {
      // If a transaction fails, we save that error in the component's state.
      // We only save one such error, so before sending a second transaction, we
      // clear it.
      this._dismissTransactionError();

      // We send the transaction, and save its hash in the Dapp's state. This
      // way we can indicate that we are waiting for it to be mined.
      const tx = await this._token.transfer(to, amount);
      this.setState({ txBeingSent: tx.hash });

      // We use .wait() to wait for the transaction to be mined. This method
      // returns the transaction's receipt.
      const receipt = await tx.wait();

      // The receipt, contains a status flag, which is 0 to indicate an error.
      if (receipt.status === 0) {
        // We can't know the exact error that made the transaction fail when it
        // was mined, so we throw this generic one.
        throw new Error("Transaction failed");
      }

      // If we got here, the transaction was successful, so you may want to
      // update your state. Here, we update the user's balance.
      await this._updateBalance();
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      this.setState({ transactionError: error });
    } finally {
      // If we leave the try/catch, we aren't sending a tx anymore, so we clear
      // this part of the state.
      this.setState({ txBeingSent: undefined });
    }
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
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

  async _getEventsData() {
    console.log("*** Inside _getEventsData");
    const events = await this._eventCreator.getEvents();
    
    const eventsData = [];
    for (let i=0; i < events.length; i++) {
      // Upload event contract
      const thisEvent = new ethers.Contract(
        events[i],
        EventArtifact.abi,
        this._provider.getSigner(0)
      );
      // Get event data
      let contractAddress = events[i];
      let owner = await thisEvent.owner();
      let ownerBalance = (await thisEvent.balances(owner)).toNumber();
      let name = await thisEvent.name();
      let symbol = await thisEvent.symbol();
      let numTicketsLeft = (await thisEvent.numTicketsLeft()).toNumber();
      let price = (await thisEvent.price()).toNumber();
      let canBeResold = await thisEvent.canBeResold();
      let royaltyPercent = (await thisEvent.royaltyPercent()).toNumber();
      let stage = await thisEvent.stage();
      let myTickets = (await thisEvent.balanceOf(this.state.selectedAddress)).toNumber();
      console.log("MY TICKETS: ", myTickets);
      // Create event data object
      let thisEventData = {
        "contract": thisEvent,
        "contractAddress": contractAddress,
        "owner": owner,
        "ownerBalance": ownerBalance,
        "name": name,
        "symbol": symbol,
        "numTicketsLeft": numTicketsLeft,
        "price": price,
        "canBeResold": canBeResold,
        "royaltyPercent": royaltyPercent,
        "stage": stage,
        "myTickets": myTickets,
      }
      eventsData.push(thisEventData);
    }
    
    this.setState({events: eventsData});
  }

  // This method sends an ethereum transaction to transfer tokens.
  // While this action is specific to this application, it illustrates how to
  // send a transaction.
  async _createEvent(numTickets, price, canBeResold, royaltyPercent, name, symbol) {
    // Sending a transaction is a complex operation:
    //   - The user can reject it
    //   - It can fail before reaching the ethereum network (i.e. if the user
    //     doesn't have ETH for paying for the tx's gas)
    //   - It has to be mined, so it isn't immediately confirmed.
    //     Note that some testing networks, like Hardhat Network, do mine
    //     transactions immediately, but your dapp should be prepared for
    //     other networks.
    //   - It can fail once mined.
    //
    // This method handles all of those things, so keep reading to learn how to
    // do it.

    try {
      // If a transaction fails, we save that error in the component's state.
      // We only save one such error, so before sending a second transaction, we
      // clear it.
      this._dismissTransactionError();

      // We send the transaction, and save its hash in the Dapp's state. This
      // way we can indicate that we are waiting for it to be mined.
      const tx = await this._eventCreator.createEvent(numTickets, price, canBeResold, royaltyPercent, name, symbol);
      this.setState({ txBeingSent: tx.hash });

      // We use .wait() to wait for the transaction to be mined. This method
      // returns the transaction's receipt.
      const receipt = await tx.wait();

      // The receipt, contains a status flag, which is 0 to indicate an error.
      if (receipt.status === 0) {
        // We can't know the exact error that made the transaction fail when it
        // was mined, so we throw this generic one.
        throw new Error("Transaction failed");
      }

      // If we got here, the transaction was successful, so you may want to
      // update your state. Here, we update the user's balance.
      await this._updateBalance();
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      console.error("Error: ", error);
      this.setState({ transactionError: error });
    } finally {
      // If we leave the try/catch, we aren't sending a tx anymore, so we clear
      // this part of the state.
      this.setState({ txBeingSent: undefined });
    }
  }

  // This method sends an ethereum transaction to transfer tokens.
  // While this action is specific to this application, it illustrates how to
  // send a transaction.
  async _setEventStage(index) {
    console.log("*** Inside set event stage")
    // Sending a transaction is a complex operation:
    //   - The user can reject it
    //   - It can fail before reaching the ethereum network (i.e. if the user
    //     doesn't have ETH for paying for the tx's gas)
    //   - It has to be mined, so it isn't immediately confirmed.
    //     Note that some testing networks, like Hardhat Network, do mine
    //     transactions immediately, but your dapp should be prepared for
    //     other networks.
    //   - It can fail once mined.
    //
    // This method handles all of those things, so keep reading to learn how to
    // do it.

    try {
      // If a transaction fails, we save that error in the component's state.
      // We only save one such error, so before sending a second transaction, we
      // clear it.
      this._dismissTransactionError();

      // We send the transaction, and save its hash in the Dapp's state. This
      // way we can indicate that we are waiting for it to be mined.
      const tx = await this.state.events[index].contract.setStage(parseInt(this.state.eventStage));
      this.setState({ txBeingSent: tx.hash });

      // We use .wait() to wait for the transaction to be mined. This method
      // returns the transaction's receipt.
      const receipt = await tx.wait();

      // The receipt, contains a status flag, which is 0 to indicate an error.
      if (receipt.status === 0) {
        // We can't know the exact error that made the transaction fail when it
        // was mined, so we throw this generic one.
        throw new Error("Transaction failed");
      }

      // If we got here, the transaction was successful, so you may want to
      // update your state. Here, we update the user's balance.
      await this._updateBalance();
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      this.setState({ transactionError: error });
    } finally {
      // If we leave the try/catch, we aren't sending a tx anymore, so we clear
      // this part of the state.
      this.setState({ txBeingSent: undefined });
    }
  }

  // This method sends an ethereum transaction to transfer tokens.
  // While this action is specific to this application, it illustrates how to
  // send a transaction.
  async _buyTicket(index) {
    console.log("*** Inside buyTicket")
    // Sending a transaction is a complex operation:
    //   - The user can reject it
    //   - It can fail before reaching the ethereum network (i.e. if the user
    //     doesn't have ETH for paying for the tx's gas)
    //   - It has to be mined, so it isn't immediately confirmed.
    //     Note that some testing networks, like Hardhat Network, do mine
    //     transactions immediately, but your dapp should be prepared for
    //     other networks.
    //   - It can fail once mined.
    //
    // This method handles all of those things, so keep reading to learn how to
    // do it.

    try {
      // If a transaction fails, we save that error in the component's state.
      // We only save one such error, so before sending a second transaction, we
      // clear it.
      this._dismissTransactionError();

      // We send the transaction, and save its hash in the Dapp's state. This
      // way we can indicate that we are waiting for it to be mined.
      const tx = await this.state.events[index].contract.buyTicket();
      this.setState({ txBeingSent: tx.hash });

      // We use .wait() to wait for the transaction to be mined. This method
      // returns the transaction's receipt.
      const receipt = await tx.wait();
      console.log("RECEIPT: ", receipt);

      // The receipt, contains a status flag, which is 0 to indicate an error.
      if (receipt.status === 0) {
        // We can't know the exact error that made the transaction fail when it
        // was mined, so we throw this generic one.
        throw new Error("Transaction failed");
      }

      // If we got here, the transaction was successful, so you may want to
      // update your state. Here, we update the user's balance.
      await this._updateBalance();
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      this.setState({ transactionError: error });
    } finally {
      // If we leave the try/catch, we aren't sending a tx anymore, so we clear
      // this part of the state.
      this.setState({ txBeingSent: undefined });
    }
  }

  async _setTicketForSale(index, ticketId, resalePrice) {
    console.log("*** Inside setTicketForSale");
    try {
      this._dismissTransactionError();
      const tx = await this.state.events[index].contract.setTicketForSale(ticketId, resalePrice);
      this.setState({ txBeingSent: tx.hash });
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      await this._updateBalance();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  // async _getEventsData() {
  //   const events = await this._token.events();
  //   const symbol = await this._token.symbol();

  //   this.setState({ tokenData: { name, symbol } });
  // }
}
