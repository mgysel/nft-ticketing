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

import {
  Heading,
  Button,
  FormLabel,
  Input,
  Stack,
  Radio,
  RadioGroup,
  TabPanel
} from "@chakra-ui/react";

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// Allows user to create an event, submitting an event smart contract to blockchain
export class CreateEvent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // Create Event Form
      formEventName: "",
      formEventSymbol: "",
      formNumTickets: '',
      formPrice: '',
      formCanBeResold: true,
      formRoyaltyPercent: '',
    }
  }
  
  async createEvent(numTickets, price, canBeResold, royaltyPercent, name, symbol) {
    try {
      this.props.dismissTransactionError();
      const gweiPrice = ethers.BigNumber.from(price.toString()).mul(ethers.BigNumber.from(10).pow(9));
      const tx = await this.props.eventCreator.createEvent(numTickets, gweiPrice, canBeResold, royaltyPercent, name, symbol);
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
      <Stack width="600px" align="center" justify="center">
        <Heading mb="25px">Create an Event Now</Heading>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              this.createEvent(
                this.state.formNumTickets, 
                this.state.formPrice, 
                this.state.formCanBeResold, 
                this.state.formRoyaltyPercent, 
                this.state.formEventName, 
                this.state.formEventSymbol
              )
              this.setState({ formEventName: '' });
              this.setState({ formEventSymbol: '' });
              this.setState({ formNumTickets: '' })
              this.setState({ formPrice: '' });
              this.setState({ formCanBeResold: true });
              this.setState({ formRoyaltyPercent: '' });
            }}
          >
            <Input
              isRequired
              id='name'
              type='text'
              size="md"
              value={this.state.formEventName}
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
              value={this.state.formEventSymbol}
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
              value={this.state.formNumTickets}
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
              value={this.state.formPrice}
              placeholder='Price (in Gwei)'
              onChange={(e) => this.setState({ formPrice: e.target.value })}
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
                <Radio mt="5px" value={true}>Yes</Radio>
                <Radio mt="5px" value={false}>No</Radio>
              </Stack>
            </RadioGroup>
            <Input
              isRequired
              id='royaltyPercent'
              type='number'
              size="md"
              value={this.state.formRoyaltyPercent}
              placeholder='Resale royalty (%)'
              onChange={(e) => this.setState({ formRoyaltyPercent: e.target.value })}
              mb="10px"
              _placeholder={{ color: 'gray.500' }}
              w="450px"
            />
          <Button 
            type='submit' 
            color={this.props.state.darkGreen}
            backgroundColor={this.props.state.lightGreen}
            size="lg"
            mt="10px"
          >
              CREATE EVENT
          </Button>
        </form>
      </Stack>
    </TabPanel>
  )}
}
