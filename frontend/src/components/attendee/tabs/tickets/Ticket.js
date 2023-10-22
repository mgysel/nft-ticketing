import React, { useEffect } from "react";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.

import { ethers } from "ethers";

import {
  Button,
  Text,
  Input,
  Box,
} from "@chakra-ui/react";

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Ticket extends React.Component {  
  constructor(props) {
    super(props);
    console.log("*** Inside Ticket Constructor");
    console.log("PROPS: ", this.props);

    this.state = {
      resaleTicketPrice: "",
    }
  }
  
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
    <Box 
      borderRadius="5px"
      border="1px solid"
      borderColor="gray.200"
      p="20px"
      width="100%"
    >
      <Text pb={0} mb={1} isTruncated fontWeight="bold" fontSize="xl">Ticket for {this.props.event.name}</Text>
      <Text pb={0} mb={1} >Ticket ID: {this.props.ticket.ticketID}</Text>
      <Box
        borderRadius="5px"
        border="1px solid"
        borderColor="gray.100"
        padding="10px"
        mt="10px"
      >
        { this.props.event.stage === 1 && 
          <form>
            <Input
              isRequired
              id='resalePrice'
              type='number'
              size="md"
              placeholder='Set Resale Price (Gwei)'
              value = {this.state.resaleTicketPrice}
              onChange={(e) => this.setState({resaleTicketPrice: e.target.value})}
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
                this.setTicketForSale(
                  this.props.event, 
                  this.props.ticket.ticketID, 
                  this.state.resaleTicketPrice
                );
                this.setState({resaleTicketPrice: ""});
              }}
            >
              Set Ticket For Sale
            </Button>
          </form>
        }
        { this.props.event.stage === 2 && this.props.ticket.status !== 1 &&
          <form>
          <Button 
            type='submit' 
            color={this.props.state.darkGreen}
            backgroundColor={this.props.state.lightGreen}
            size="lg"
            mt="10px"
            width="100%"
            onClick={(e) => {
              e.preventDefault()
              this.setTicketToUsed(this.props.event, this.props.ticket.ticketID)
            }}
          >
            Use Ticket
          </Button>
        </form>
        }
      </Box>
    </Box>
      )
    }
}
