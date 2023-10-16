import React from "react";

import {
  Box,
  Center,
  Heading,
  HStack,
  Link,
  Popover,
  PopoverTrigger,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useHistory, useLocation } from 'react-router-dom';

export class Navbar extends React.Component {  
  constructor(props) {
    super(props);

    // Nav component colors
    const color1 = 'white';
    const color2 = 'gray.400';
    const urlList = window.location.href.split('/');
    const url = urlList[urlList.length - 1];
    console.log("NAVBAR URL: ", url);
    if (url === '') {
      this.state = {
        bgColor1: color2,
        bgColor2: color1,
        bgColor3: color1,
      }
    } else if (url === 'event-organizers') {
      this.state = {
        bgColor1: color1,
        bgColor2: color2,
        bgColor3: color1,
      }
    } else if (url === 'balance') {
      this.state = {
        bgColor1: color1,
        bgColor2: color1,
        bgColor3: color2,
      }
    } else {
      this.state = {
        bgColor1: color1,
        bgColor2: color1,
        bgColor3: color1,
      }
    }


    console.log("PROPS: ", props);
    console.log("STATE: ", this.state);
  }

  // If everything is loaded, we render the application.
  render() {

  return (
    <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
      <VStack m={0} p={0} ml={5} spacing={0} alignItems="left">
        <Heading fontSize='3xl' color="white" p={0} m={0}>
          TicketChain
        </Heading>
        <Text fontSize='sm' color="white" p={0} m={0} ml={1} mb={1} >
          Balance: {(Number(this.props.state.balance).toFixed(1)).toString()} ETH
        </Text>
      </VStack>
      <Stack direction={'row'} spacing={0} mr='10px'>
        <Center>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Link
                p={2}
                as={RouterLink}
                to={'/'}
                fontSize={'md'}
                fontWeight={500}
                color={this.state.bgColor1}
                _hover={{
                  textDecoration: 'none',
                  color: this.props.state.navLinkHoverColor,
                }}
                onClick={(e) => {
                  this.setState({bgColor1: 'gray.400', bgColor2: 'white', bgColor3: 'white'});
                }}
              >
                Attendees
              </Link>
            </PopoverTrigger>
          </Popover>
        </Center>
        <Center>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Text
                p={2}
                as={RouterLink}
                to={'/event-organizers'}
                fontSize={'md'}
                fontWeight={500}
                color={this.state.bgColor2}
                _hover={{
                  textDecoration: 'none',
                  color: this.props.state.navLinkHoverColor,
                }}
                onClick={() => {
                  this.setState({bgColor1: 'white', bgColor2: 'gray.400', bgColor3: 'white'});
                }}
              >
                Event Organizers
              </Text>
            </PopoverTrigger>
          </Popover>
        </Center>
        <Center>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Link
                p={2}
                as={RouterLink}
                to={'/balance'}
                fontSize={'md'}
                fontWeight={500}
                color={this.state.bgColor3}
                _hover={{
                  textDecoration: 'none',
                  color: this.props.state.navLinkHoverColor,
                }}
                onClick={() => {
                  this.setState({bgColor1: 'white', bgColor2: 'white', bgColor3: 'gray.400'});
                }}
              >
                Balance
              </Link>
            </PopoverTrigger>
          </Popover>
        </Center>
      </Stack>
    </nav>
  )}
}
