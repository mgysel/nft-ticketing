import React from "react";

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

export class EntryGate extends React.Component {  

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
      <Heading mb="25px">Event Entry</Heading>
      {
        this.props.state.events.length === 0 && (
          <EmptyMessage message={`You cannot enter an event until your tickets \n for an event are open for entry!`} />
        )
      }

      { this.props.state.events.length > 0 &&
        <SimpleGrid columns={4} spacing={10} mt="30px">
          { 
            this.props.state.events.map((event, index) => (
              event.myTicketsNum > 0 && event.stage === 2 &&
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
                        id='eventStage'
                        type='number'
                        size="md"
                        placeholder='Set Ticket ID'
                        onChange={(e) => this.props.setState({ "usedTicketID": e.target.value})}
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
                          this.setTicketToUsed(event, this.props.state.usedTicketID)
                        }}
                      >
                        Use Ticket
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
