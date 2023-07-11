type SubRouteDto = {
  dex_id: string
  dex_type: string
  tokens: string[]
  pools: string[]
}

export type SubRoute = {
  dexType: number
  tokens: string[]
  pools: string[]
  extraData: string
}

type RouteDto = {
  part: number
  sub_routes: SubRouteDto[]
}

export type Route = {
  inputAmount: string
  subRoutes: SubRoute[]
}

export type ResultDto = {
  routes: RouteDto[]
  amount_in: number
  amount_out: number
  parts: number
  runtime_graph_algorithm: number
  runtime: number
  block_number: number
  acc_gas_fee: number
}

export type PathResponseDto = {
  success: boolean
  result: ResultDto
  error: any
}

export type SwapInput = {
  routes: Route[]
  amountIn: string
  amountOut: string
  parts: number
  blockNumber: number
  accGasFee: string
}
