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

export class MyTickets extends React.Component {  
  constructor(props) {
    super(props);

    // this.props.updateBalance();
    // this.props.getEventsData();
    
    // Determine number of secondary market tickets
    var hasTickets = false;
    for (var i = 0; i < this.props.state.events.length; i++) {
      if (this.props.state.events[i].myTicketsNum > 0) {
        hasTickets = true;
        break;
      }
    }

    // Set number of secondary market tickets
    this.state = {
      hasTickets: hasTickets,
    }
  }
  
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
      !this.state.hasTickets && (
        <EmptyMessage message={`You don't have any tickets.\n Purchase tickets to have fun at our events!`} />
      )
    }

    { this.state.hasTickets &&
      <SimpleGrid columns={3} spacing={5} mt="30px">
        { 
          this.props.state.events.map((event, index) => (
            event.myTicketsNum > 0 && 
              <Box 
                key={index}
                borderRadius="5px"
                border="1px solid"
                borderColor="gray.200"
                p="20px"
                width="100%"
              >
                <Text pb={0} mb={1} isTruncated fontWeight="bold" fontSize="xl">Ticket for {event.name}</Text>
                <Text pb={0} mb={1} >Num Tickets: {event.myTicketsNum}</Text>
                <Text pb={0} mb={1} >Ticket IDs: {event.myTicketsID.join(", ")}</Text>
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
                      width="100%"
                      onClick={(e) => {
                        e.preventDefault()
                        this.setTicketForSale(event, this.props.state.resaleTicketID, this.props.state.resalePrice);
                      }}
                    >
                      Set Ticket For Sale
                    </Button>
                  </form>
                </Box>
              </Box>
          ))
        }
      </SimpleGrid>
    }
  </TabPanel>
  )}
}
