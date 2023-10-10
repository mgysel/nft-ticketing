
import React, { useState, useEffect } from 'react';
import { ColorModeProvider } from "@chakra-ui/color-mode";
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
import Web3 from 'web3'
import Event from "../contracts/Event.json";
import EventCreator from "../contracts/Event.json";
// This function detects most providers injected at window.ethereum
// import detectEthereumProvider from '@metamask/detect-provider';
var ether_port = 'ws://localhost:8545';
var oContractsMap = {};

export function Landing() {
  const [web3, setWeb3] = useState("undefined");
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [netId, setNetId] = useState("");
  const [eventCreator, setEventCreator] = useState("");
  const [eventContracts, setEventContracts] = useState([]);
  const [eventAddresses, setEventAddresses] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [secondaryTickets, setSecondaryTickets] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [arrQRCode, setArrQRCode] = useState([]);

  const [formEventName, setFormEventName] = useState("");
  const [formEventSymbol, setFormEventSymbol] = useState("");
  const [formNumTickets, setFormNumTickets] = useState(0);
  const [formPrice, setFormPrice] = useState(0);
  const [formCanBeResold, setFormCanBeResold] = useState(true);
  const [formRoyaltyPercent, setFormRoyaltyPercent] = useState(0);

  const [resalePrice, setResalePrice] = useState("");
  const [sRandomHash, setSRandomHash] = useState("");
  const [eventStage, setEventStage] = useState(0);
  const [qrCodeValue, setQrCodeValue] = useState(0);
  const [verificationResult, setVerificationResult] = useState("");

  // Styling
  const lightGreen = "#C6F6DF";
  const darkGreen = "#276749";

  const backendServer = "http://127.0.0.1:2122";
  
  return (
  <div>
    <Flex w="90%" my="20px" 
      ml="5%"
      mr="5%"
      direction="column"
    >
      <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
        <Heading ml={20} color="white">
          TicketChain
        </Heading>
        <VStack spacing={2} alignItems="right">
          <Box className="navbar-brand pb-0 mb-0" justify="right">
            Account: {account}
          </Box>
          <Box className="navbar-brand pt-0 mt-0" justify="right">
            Balance: {balance}
          </Box>
        </VStack>
      </nav>
      <Tabs 
        mt="100px"
        p="20px"
        variant="soft-rounded"
        colorScheme="green"
        borderRadius="5px"
        border="1px solid"
        borderColor="gray.200"
      >
        <TabList>
          <Tab>
            Create Events
          </Tab>
        </TabList>
        <TabPanels>
        <TabPanel mt="15px" mb="15px" align="center">
            <Stack width="600px" align="center" justify="center">
              <Heading mb="25px">Create an Event Now</Heading>
                <form>
                  <Input
                    isRequired
                    id='name'
                    type='text'
                    size="md"
                    placeholder='Event name'
                    onChange={(e) => setFormEventName(e.target.value)}
                    mb="10px"
                    _placeholder={{ color: 'gray.500' }}
                    w="450px"
                  />
                  <Input
                    isRequired
                    id='symbol'
                    type='text'
                    size="md"
                    placeholder='Token symbol'
                    onChange={(e) => setFormEventSymbol(e.target.value)}
                    mb="10px"
                    _placeholder={{ color: 'gray.500' }}
                    w="450px"
                  />
                  <Input
                    isRequired
                    id='numTickets'
                    type='number'
                    size="md"
                    placeholder='Number of Tickets'
                    onChange={(e) => setFormNumTickets(e.target.value)}
                    mb="10px"
                    _placeholder={{ color: 'gray.500' }}
                    w="450px"
                  />
                  <Input
                    isRequired
                    id='price'
                    type='number'
                    size="md"
                    placeholder='Price'
                    onChange={(e) => setFormPrice(e.target.value)}
                    mb="10px"
                    _placeholder={{ color: 'gray.500' }}
                    w="450px"
                  />
                  <RadioGroup 
                    mb="10px"
                    _placeholder={{ color: 'gray.500' }}
                    w="450px"
                    h="40px"
                    onChange={setFormCanBeResold} value={formCanBeResold}
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
                      <Radio value={true}>Yes</Radio>
                      <Radio value={false}>No</Radio>
                    </Stack>
                  </RadioGroup>
                  <Input
                    isRequired
                    id='royaltyPercent'
                    type='number'
                    size="md"
                    placeholder='Resale royalty (%)'
                    onChange={(e) => setFormRoyaltyPercent(e.target.value)}
                    mb="10px"
                    _placeholder={{ color: 'gray.500' }}
                    w="450px"
                  />
                <Button 
                  type='submit' 
                  color={darkGreen}
                  backgroundColor={lightGreen}
                  size="lg"
                  mt="10px"
                >
                    CREATE EVENT
                </Button>
              </form>
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>

    </Flex>
  </div>
  );
}