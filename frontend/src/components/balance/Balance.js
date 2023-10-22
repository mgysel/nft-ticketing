import React from "react";

import { EmptyMessage } from "../error_handling/EmptyMessage";

import {
  Heading,
  Button,
  Center,
  Text,
  SimpleGrid,
  Box,
} from "@chakra-ui/react";

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// ALlows user to view and withdraw balance
export class Balance extends React.Component {  
  constructor(props) {
    super(props);

    this.props.updateBalance();
    this.props.getEventsData();
  }

  async withdraw(event) {
    try {
      this.props.dismissTransactionError();
      const tx = await event.contract.withdraw();
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
      this.props.getEventsData();
    }
  }

  // If everything is loaded, we render the application.
  render() {
  return (
    <Box
      mt="60px"
      p="20px"
      variant="soft-rounded"
      colorScheme="green"
      borderRadius="5px"
      border="1px solid"
      borderColor="gray.200"
    >
      <Center>
        <Heading mt='15px' mb="15px">Withdraw Balance from Events</Heading>
      </Center>
      {
        !this.props.state.hasBalance && (
          <EmptyMessage message={`You have no balance to withdraw. Sell primary or secondary market tickets to withdraw a balance. Note that an event must be Closed for an event organizer to withdraw their balance`} />
        )
      }

      { this.props.state.hasBalance &&
        <SimpleGrid columns={3} spacing={5} mt="30px">
          { 
            this.props.state.events.map((event, index) => (
              event.userBalance > 0 && 
                <Box 
                  key={index} 
                  borderRadius="5px"
                  border="1px solid"
                  borderColor="gray.200"
                  p="20px" 
                  width="100%"
                >
                  <Text pb={0} mb={1} isTruncated fontWeight="bold" fontSize="xl"> Event: {event.name}</Text>
                  <Text pb={0} mb={1}>Balance: ${event.userBalance * (10 ** 9)} Gwei</Text>
                  <Button 
                    type='submit' 
                    color={this.props.state.darkGreen}
                    backgroundColor={this.props.state.lightGreen}
                    size="lg"
                    width="100%"
                    onClick={(e) => {
                      e.preventDefault()
                      this.withdraw(event)
                    }}
                    mt={2}
                  >
                    Withdraw Balance
                  </Button>
                </Box>
            ))
          }
        </SimpleGrid>
      }
    </Box>
  )}
}
