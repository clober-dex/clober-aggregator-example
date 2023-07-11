import { DexType, TRADE_API_BASE_URL } from './constants'
import { ethers } from 'ethers'
import BigNumber from 'bignumber.js'
import qs from 'qs'
import { PathResponseDto, ResultDto, Route, SubRoute, SwapInput } from './types'

const buildExtraData = (dexId: string): string => {
  if (dexId === 'QUICKSWAP_V3') {
    return '0x000000000000000000000000f6ad3ccf71abb3e12becf6b3d2a74c963859adcd'
  } else if (dexId === 'DOVESWAP_V3') {
    return '0x00000000000000000000000095bf28c6502a0544c7adc154bc60d886d9a80a5c'
  } else {
    return ethers.utils.formatBytes32String('')
  }
}

const buildRoutes = (bestResult: ResultDto): Route[] => {
  const parts = bestResult.parts
  const routes: Route[] = []
  bestResult.routes.forEach((routeDto) => {
    const inputAmount = new BigNumber(bestResult.amount_in)
      .multipliedBy(routeDto.part)
      .div(parts)
      .toFixed(0)
    const subRoutes: SubRoute[] = routeDto.sub_routes.map((subRoute) => {
      const dexType = DexType[subRoute.dex_type as keyof typeof DexType]
      return {
        dexType,
        tokens: subRoute.tokens,
        pools: subRoute.pools,
        extraData: buildExtraData(subRoute.dex_id),
      }
    })

    const route: Route = {
      inputAmount,
      subRoutes,
    }
    routes.push(route)
  })
  return routes
}

async function fetchTradeApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${TRADE_API_BASE_URL}/${path}`, options)
  if (response.ok) {
    return response.json()
  } else {
    const errorResponse = await response.json()
    throw new Error(errorResponse.message || 'Unknown Error')
  }
}

export async function fetchPath({
  amountIn,
  tokenIn,
  tokenOut,
  gasEffectiveMode,
}: {
  amountIn: string
  tokenIn: string
  tokenOut: string
  gasEffectiveMode: boolean
}): Promise<SwapInput> {
  const { result } = await fetchTradeApi<PathResponseDto>(
    `quotes?${qs.stringify({
      tokenIn,
      tokenOut,
      amountIn,
      parts: 1,
      maxHops: 5,
      fastestMode: false,
      gasEffectiveMode,
    })}`,
  )
  const routes: Route[] = buildRoutes(result)

  return {
    routes,
    amountIn: new BigNumber(result.amount_in).toFixed(0),
    amountOut: new BigNumber(result.amount_out).toFixed(0),
    parts: result.parts,
    blockNumber: result.block_number,
    accGasFee: new BigNumber(result.acc_gas_fee).toFixed(0),
  }
}
