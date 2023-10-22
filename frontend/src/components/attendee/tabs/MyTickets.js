import React, { useEffect } from "react";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { EmptyMessage } from "../../error_handling/EmptyMessage";
import { Ticket } from "./tickets/Ticket.js";

import { ethers } from "ethers";

import {
  Heading,
  Button,
  Text,
  Input,
  SimpleGrid,
  Box,
  TabPanel
} from "@chakra-ui/react";

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// Allows user to view, resell, and use event tickets
export class MyTickets extends React.Component {  
  constructor(props) {
    super(props);

    this.state = {
      resaleTicketPrice: "",
      ticketsID: 0,
    }
  }
  
  // Submits setTicketForSale transaction to event smart contract
  async setTicketForSale(event, ticketId, resalePrice) {
    try {
      this.props.dismissTransactionError();
      const gweiPrice = ethers.BigNumber.from(resalePrice.toString()).mul(ethers.BigNumber.from(10).pow(9));
      const tx = await event.contract.setTicketForSale(ticketId, gweiPrice);
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

  // Submits setTicketToUsed transaction to event smart contract
  async setTicketToUsed(event, ticketID) {
    try {
      this.props.dismissTransactionError();
      const tx = await event.contract.setTicketToUsed(ticketID);
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

  // If everything is loaded, we render the application.
  render() {
  return (
    <TabPanel mt="15px" mb="15px" align="center">
    <Heading mb="25px">Upcoming Events</Heading>
    {
      !this.props.state.hasTicketsUnused && (
        <EmptyMessage message={`You don't have any tickets.\n Purchase tickets to have fun at our events!`} />
      )
    }

    { this.props.state.hasTicketsUnused &&
      <SimpleGrid columns={3} spacing={5} mt="30px">
        { 
          this.props.state.events.map((event, indexEvent) => (
            event.myTickets.map((ticket, indexTicket) => (
              ticket.status !== 1 &&
              <Ticket 
                indexEvent={indexEvent}
                indexTicket={indexTicket}
                event={event}
                ticket={ticket}
                state={this.props.state}
                setState={this.props.setState}
                dismissTransactionError={this.props.dismissTransactionError}
                eventCreator={this.props.eventCreator}
                updateBalance={this.props.updateBalance}
                getEventsData={this.props.getEventsData}
              />
            ))
          ))
      
        }
      </SimpleGrid>
    }

    <Heading mt='25px'>Used Tickets</Heading>
    {
      !this.props.state.hasTicketsUsed && (
        <EmptyMessage message={`You haven't used any tickets.\n Purchase/use tickets to have fun at our events!`} />
      )
    }
    
    { this.props.state.hasTicketsUsed &&
      <SimpleGrid columns={3} spacing={5} mt="30px">
        { 
          this.props.state.events.map((event, indexEvent) => (
            event.myTickets.map((ticket, indexTicket) => (
              ticket.status === 1 && 
              <Box 
                borderRadius="5px"
                border="1px solid"
                borderColor="gray.200"
                p="20px"
                width="100%"
              >
                <Text pb={0} mb={1} isTruncated fontWeight="bold" fontSize="xl">Ticket for {event.name}</Text>
                <Text pb={0} mb={1} >Ticket ID: {ticket.ticketID}</Text>
              </Box>
            ))
          ))
      
        }
      </SimpleGrid>
    }
  </TabPanel>
  )}
}
