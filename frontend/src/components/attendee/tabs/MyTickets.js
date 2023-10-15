import React from "react";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { EmptyMessage } from "../../error_handling/EmptyMessage";

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
export class MyTickets extends React.Component {  
  async setTicketForSale(event, ticketId, resalePrice) {
    try {
      this.props.dismissTransactionError();
      const tx = await event.contract.setTicketForSale(ticketId, resalePrice);
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
    <Heading mb="25px">My Tickets</Heading>
    {
      this.props.state.events.length === 0 && (
        <EmptyMessage message={`You don't have any tickets.\n Purchase tickets to have fun at our events!`} />
      )
    }

    { this.props.state.events.length > 0 &&
      <SimpleGrid columns={4} spacing={10} mt="30px">
        { 
          this.props.state.events.map((event, index) => (
            event.myTicketsNum > 0 && 
              <Box 
                key={index}
                borderRadius="5px"
                border="1px solid"
                borderColor="gray.200"
                p="20px"
                width="20rem"
              >
                <Text isTruncated fontWeight="bold" fontSize="xl" mb="7px">Ticket for Event {event.name}</Text>
                <Text>Event: {event.name}</Text>
                <Text>Num Tickets: {event.myTicketsNum}</Text>
                <Text>Ticket IDs: {event.myTicketsID.join(", ")}</Text>
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
                      onChange={(e) => this.props.setState({"resalePrice": e.target.value})}
                      mb="0px"
                      mt="10px"
                      _placeholder={{ color: 'gray.500' }}
                    />
                    <Input
                      isRequired
                      id='resalePrice'
                      type='number'
                      size="md"
                      placeholder='Set Ticket ID'
                      onChange={(e) => this.props.setState({"resaleTicketID": e.target.value})}
                      mb="0px"
                      mt="10px"
                      _placeholder={{ color: 'gray.500' }}
                    />
                    <Button 
                      type='submit' 
                      color={this.props.state.darkGreen}
                      backgroundColor={this.props.state.lightGreen}
                      size="lg"
                      mt="10px"
                      width="210px"
                      onClick={(e) => {
                        e.preventDefault()
                        this.setTicketForSale(event, this.props.state.resaleTicketID, this.props.state.resalePrice);
                      }}
                    >
                      Set Ticket For Sale
                    </Button>
                  </form>
                </Box>
                <Button 
                  type='submit' 
                  color={this.props.state.darkGreen}
                  backgroundColor={this.props.state.lightGreen}
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
    }
  </TabPanel>
  )}
}
