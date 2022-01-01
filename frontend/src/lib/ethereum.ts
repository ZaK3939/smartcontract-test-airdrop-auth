import detectEthereumProvider from '@metamask/detect-provider';
import { useContext } from 'react';
import Web3 from 'web3';
import { AbiItem } from "web3-utils";
// import { Airdrop } from '../hardhat/typechain/Airdrop';
import Airdrop from '../../../artifacts/contracts/Airdrop.sol/Airdrop.json';
import { AirdropContext } from '../hardhat/SymfoniContext';
const CONTRACT_ADDRESS = '0x188E7Da04d971E936120A643e9fb09eA84C27b1F';

interface chinObj {
 [id: string]: string;
}

const networks:chinObj = {
  '56': 'Binance Smart Chain Mainnet', 
  '97': 'Binance Smart Chain Testnet', 
  '5777': 'Local development blockchain',
  '80001': 'matic/polygon mumbai testnet' 
}

const getBlockchain = ()=>
  new Promise<any>( async (resolve, reject) => {
    
    const provider:any = await detectEthereumProvider();
    if(provider) {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const networkId = await provider.request({ method: 'net_version' })
      const targetNetwork =process.env.NEXT_PUBLIC_NETWORK_ID || '0'
      if(networkId !== targetNetwork) {
        reject(`Wrong network, please switch to ${networks[targetNetwork]}`);
        return;
      }
      const abi = ({} as any) as AbiItem;
      const web3 = new Web3(provider);
      const airdrop = new web3.eth.Contract(
        Airdrop.abi as AbiItem[],
        CONTRACT_ADDRESS
      );
      resolve({airdrop, accounts});
      return;
    }
    reject('Install Metamask');
  });

export default getBlockchain;
