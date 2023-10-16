import React from "react";

import { EmptyMessage } from "../../error_handling/EmptyMessage";

import {
  Heading,
  Button,
  Text,
  SimpleGrid,
  Box,
  Stack,
  Radio,
  RadioGroup,
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
export class MyEvents extends React.Component {  

  async setEventStage(event, stage) {
    try {
      this.props.dismissTransactionError();
      const tx = await event.contract.setStage(parseInt(stage));
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
      <Heading mb="25px">My Events</Heading>
      {
        !this.props.state.hasEvents && (
          <EmptyMessage message={`You have not created any events yet!`} />
        )
      }

      { this.props.state.hasEvents &&
        <SimpleGrid columns={3} spacing={5} mt="30px">
          { 
            this.props.state.events.map((event, index) => (
              <Box 
                key={index} 
                borderRadius="5px"
                border="1px solid"
                borderColor="gray.200"
                p="20px" 
                width="100%"
              >
                <Text pb={0} mb={1} isTruncated fontWeight="bold" fontSize="xl"> Event: {event.name}</Text>
                <Text pb={0} mb={1}>Balance: ${event.ownerBalance}</Text>
                <Text pb={0} mb={1}>Tickets Remaining: {event.numTicketsLeft}</Text>
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
                      this.props.setState({eventStage: e});
                    }} 
                    defaultValue={event.stage.toString()}
                  >
                    <Stack spacing={4} direction="column">
                      <Radio value="0" m={0}>Prep</Radio>
                      <Radio value="1" m={0}>Active</Radio>
                      <Radio value="2" m={0}>Checkin Open</Radio>
                      <Radio value="3" m={0}>Cancelled</Radio>
                      <Radio value="4" m={0}>Closed</Radio>
                    </Stack>
                  </RadioGroup>
                  <Button 
                    type='submit' 
                    color={this.props.state.darkGreen}
                    backgroundColor={this.props.state.lightGreen}
                    size="lg"
                    width="100%"
                    onClick={(e) => {
                      e.preventDefault()
                      this.setEventStage(event, this.props.state.eventStage)
                    }}
                    mt={2}
                  >
                    Set Event Stage
                  </Button>
                </Box>
              </Box>
            ))
          }
        </SimpleGrid>
      }
  </TabPanel>
  )}
}
