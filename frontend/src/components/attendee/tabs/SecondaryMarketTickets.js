import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import EventArtifact from "../../../contracts/Event.json";
import EventCreatorArtifact from "../../../contracts/EventCreator.json";
import contractAddress from "../../../contracts/contract-address.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "../../error_handling/NoWalletDetected";
import { ConnectWallet } from "../../error_handling/ConnectWallet";
import { Loading } from "../../error_handling/Loading";
import { TransactionErrorMessage } from "../../error_handling/TransactionErrorMessage";
import { WaitingForTransactionMessage } from "../../error_handling/WaitingForTransactionMessage";
import { EmptyMessage } from "../../error_handling/EmptyMessage";

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
export class SecondaryMarketTickets extends React.Component {  

  async buyTicketFromOwner(event, ticket) {
    try {
      this.props.dismissTransactionError();
      const buyTicketValue = ethers.BigNumber.from(ticket.resalePrice.toString());
      const tx = await event.contract.buyTicketFromUser(ticket.ticketID, { value: buyTicketValue });
      this.props.setState({ txBeingSent: tx.hash });
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      await this.props.updateBalance();
      await this.props.getEventsData();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      this.props.setState({ transactionError: error });
    } finally {
      this.props.setState({ txBeingSent: undefined });
    }
  }

  async approveSale(event, ticket) {
    console.log("*** Inside ApproveSale")
    
    try {
      this.props.dismissTransactionError();
      // const tx = await event.contract.getRegisteredBuyer(ticket.ticketID);
      const registeredBuyer = event.tickets[ticket.ticketID].registeredBuyers;
      const tx = await event.contract.approveAsBuyer(registeredBuyer, ticket.ticketID);
      this.props.setState({ txBeingSent: tx.hash });
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      await this.props.updateBalance();
      await this.props.getEventsData();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      this.props.setState({ transactionError: error });
    } finally {
      this.props.setState({ txBeingSent: undefined });
    }
  }

  async registerToBuy(event, ticket) {
    console.log("*** Inside registerToBuy");
    console.log("Event: ", event);
    console.log("Ticket: ", ticket);
    try {
      this.props.dismissTransactionError();
      const tx = await event.contract.registerAsBuyer(ticket.ticketID);
      this.props.setState({ txBeingSent: tx.hash });
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      await this.props.updateBalance();
      await this.props.getEventsData();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        console.log("ERROR: ", error);
        return;
      }
      this.props.setState({ transactionError: error });
    } finally {
      this.props.setState({ txBeingSent: undefined });
    }
  }

  // If everything is loaded, we render the application.
  render() {
  return (
  <TabPanel mt="15px" mb="15px" align="center">
    <Heading mb="25px">Secondary Market Tickets</Heading>
    {
        !this.props.state.hasSecondaryTickets && (
          <EmptyMessage message={`No secondary market tickets available.\n Come back when more tickets are up for sale!`} />
        )
    }

    { this.props.state.hasSecondaryTickets &&
      <SimpleGrid columns={3} spacing={5} mt="30px">
        { 
          this.props.state.events.map((event, indexEvent) => (
              event.tickets.map((ticket, indexTicket) => (
                ticket.status === 2 && 
                  <Box 
                    key={indexTicket} 
                    borderRadius="5px"
                    border="1px solid"
                    borderColor="gray.200"
                    p="20px" 
                    width="100%"
                  >
                    <Text pb={0} mb={1} isTruncated fontWeight="bold" fontSize="xl"> Event {event.name}</Text>
                    <Text pb={0} mb={1}>Event: {event.name}</Text>
                    <Text pb={0} mb={1}>Price: ${(ticket.resalePrice / (10 ** 9)).toString()} Gwei</Text>
                    <Text pb={0} mb={1}>Ticket ID: {ticket.ticketID}</Text>
                    <Button 
                      type='submit' 
                      color={this.props.state.darkGreen}
                      backgroundColor={this.props.state.lightGreen}
                      size="lg"
                      mt="13px"
                      width="100%"
                      onClick={(e) => {
                        e.preventDefault()
                        this.registerToBuy(event, ticket)
                      }}
                    >
                        Register To Buy
                    </Button>
                    <Button 
                      type='submit' 
                      color={this.props.state.darkGreen}
                      backgroundColor={this.props.state.lightGreen}
                      size="lg"
                      mt="13px"
                      width="100%"
                      onClick={(e) => {
                        e.preventDefault()
                        this.approveSale(event, ticket)
                      }}
                    >
                        Approve Sale
                    </Button>
                    <Button 
                      type='submit' 
                      color={this.props.state.darkGreen}
                      backgroundColor={this.props.state.lightGreen}
                      size="lg"
                      mt="13px"
                      width="100%"
                      onClick={(e) => {
                        e.preventDefault()
                        this.buyTicketFromOwner(event, ticket)
                      }}
                    >
                        Buy Ticket
                    </Button>
                  </Box>
            )
          )))
        }
      </SimpleGrid>
    }
  </TabPanel>
  )}
}
