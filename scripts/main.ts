import { Contract, ethers } from 'ethers'
import { GAS_LIMIT, PATH_FINDER_ADDRESS, RPC_URL } from './constants'
import { fetchPath } from './utils'
import BigNumber from 'bignumber.js'
import { SwapInput } from './types'
require('dotenv').config()

const swap = async ({
  tokenIn,
  tokenOut,
  amountIn,
  gasEffectiveMode,
  slippage,
}: {
  tokenIn: string
  tokenOut: string
  amountIn: string
  gasEffectiveMode: boolean
  slippage: number
}) => {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY is required')
  }
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider)
  const abi = require('./abi.json')
  const contract = new Contract(PATH_FINDER_ADDRESS, abi, provider)
  const swapInput: SwapInput = await fetchPath({
    amountIn,
    tokenIn,
    tokenOut,
    gasEffectiveMode,
  })

  const minOutputAmount = new BigNumber(1)
    .minus(new BigNumber(slippage).dividedBy(100).toString())
    .multipliedBy(swapInput.amountOut)
    .toFixed(0)
  const gasLimit = new BigNumber(swapInput.accGasFee)
    .multipliedBy(GAS_LIMIT)
    .toFixed(0)

  console.log(
    `[${wallet.address}] Try to swap ${swapInput.amountIn} ${tokenIn} to ${swapInput.amountOut} ${tokenOut}`,
  )

  const tx = await contract
    .connect(wallet)
    .swap(
      swapInput.routes,
      swapInput.amountIn,
      minOutputAmount,
      swapInput.amountOut,
      wallet.address,
      {
        gasLimit,
        value:
          tokenIn === ethers.constants.AddressZero ? swapInput.amountIn : 0,
      },
    )
  await tx.wait()
  console.log(tx.hash)
}

;(async () => {
  try {
    await swap({
      tokenIn:
        process.env.TOKEN_IN || '0x0000000000000000000000000000000000000000',
      tokenOut:
        process.env.TOKEN_OUT || '0x0000000000000000000000000000000000000000',
      amountIn: process.env.AMOUNT_IN || '1000000000000000000',
      gasEffectiveMode: false,
      slippage: 0.5,
    })
  } catch (error) {
    console.error(error)
  }
})()
