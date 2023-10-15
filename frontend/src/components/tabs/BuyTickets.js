import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import EventArtifact from "../../contracts/Event.json";
import EventCreatorArtifact from "../../contracts/EventCreator.json";
import contractAddress from "../../contracts/contract-address.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "../error_handling/NoWalletDetected";
import { ConnectWallet } from "../error_handling/ConnectWallet";
import { Loading } from "../error_handling/Loading";
import { TransactionErrorMessage } from "../error_handling/TransactionErrorMessage";
import { WaitingForTransactionMessage } from "../error_handling/WaitingForTransactionMessage";

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
export class BuyTickets extends React.Component {  
  async buyTicket(index) {
    try {
      this.props.dismissTransactionError();
      const tx = await this.props.state.events[index].contract.buyTicket();
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
      <Heading mb="25px">Purchase Tickets</Heading>
      <SimpleGrid columns={4} spacing={10} mt="30px">
        { 
          this.props.state.events.map((id, index) => (
              id.stage !== 0 && id.stage !== 2 && id.stage !== 5 && (
                <Box key={index}        
                  borderRadius="5px"
                  border="1px solid"
                  borderColor="gray.200"
                  p="20px" 
                  width="20rem"
                >
                  <Text isTruncated fontWeight="bold" fontSize="xl" mb="7px"> Event {index + 1}</Text>
                  <Text>Name: {id.eventName}</Text>
                  <Text>Symbol: {id.eventSymbol}</Text>
                  <Text>Number of Tickets: {id.numTicketsLeft}</Text>
                  <Text>Price: {id.price}</Text>
                  <Text>Can Be Resold?: {id.canBeResold.toString()}</Text>
                  <Text>Royalty Percent: {id.royaltyPercent}</Text>
                  <Text>Stage: {id.stage}</Text>
                  <Button 
                    type='submit' 
                    color={this.props.state.darkGreen}
                    backgroundColor={this.props.state.lightGreen}
                    size="lg"
                    mt="13px"
                    onClick={(e) => {
                      e.preventDefault()
                      this.buyTicket(index) 
                    }}
                  >
                      Buy Ticket
                  </Button>
                </Box>
              )
          ))
        }
      </SimpleGrid>
    </TabPanel>
  )}
}
