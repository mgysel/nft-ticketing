import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { EmptyMessage } from "../../error_handling/EmptyMessage";

import {
  Heading,
  Button,
  Text,
  SimpleGrid,
  Box,
  TabPanel
} from "@chakra-ui/react";

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// Class that allows user to buy event tickets
export class BuyTickets extends React.Component { 
  constructor(props) {
    super(props);

    this.state = {
      message: "",
    }
  }
  
  // Submits buyTicket transaction to event smart contract
  async buyTicket(event) {
    try {
      this.props.dismissTransactionError();
      const buyTicketValue = ethers.BigNumber.from(event.price.toString());
      const tx = await event.contract.buyTicket({ value: buyTicketValue });
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

  render() {
  return (
    <TabPanel mt="15px" mb="15px" align="center">
      <Heading mb="25px">Purchase Tickets</Heading>

      {
        this.props.state.events.length === 0 && (
          <EmptyMessage message={`No events are actively selling tickets.\n Come back when more events have been created!`} />
        )
      }

      { this.props.state.events.length > 0 &&
        <SimpleGrid columns={3} spacing={5} mt="30px">
          { 
            this.props.state.events.map((event, index) => (
                event.stage !== 0 && event.stage !== 2 && event.stage !== 5 && (
                  <Box key={index}        
                    borderRadius="5px"
                    border="1px solid"
                    borderColor="gray.200"
                    p="20px" 
                    width="100%"
                  >
                    <Text mb={0} pb={1} isTruncated fontWeight="bold" fontSize="xl"> Event: {event.name}</Text>
                    <Text mb={0} pb={1}>Tickets Remaining: {event.numTicketsLeft}</Text>
                    <Text mb={0} pb={1}>Price: ${(event.price / (10 ** 9)).toString()} Gwei</Text>
                    <Text mb={0} pb={1}>Can Be Resold?: {event.canBeResold.toString()}</Text>
                    <Text mb={0} pb={1}>Resale Royalty: {event.royaltyPercent}%</Text>
                    <Button 
                      type='submit' 
                      color={this.props.state.darkGreen}
                      backgroundColor={this.props.state.lightGreen}
                      size="lg"
                      mt="13px"
                      onClick={(e) => {
                        e.preventDefault()
                        this.buyTicket(event) 
                      }}
                      width='100%'
                    >
                        Buy Ticket
                    </Button>
                  </Box>
                )
            ))
          }
        </SimpleGrid>
      }
    </TabPanel>
  )}
}
