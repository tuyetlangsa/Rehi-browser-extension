import axiosClient from "./axios-client"
import type { BaseResponse } from "./types/api-result"
import type {
  GetOrAddDocumentRequest,
  GetOrAddDocumentResponse
} from "./types/article"
import type { CreateHighlightRequest } from "./types/highlight"

export async function getOrAddDocument(
  request: GetOrAddDocumentRequest,
  token: string
): Promise<BaseResponse<GetOrAddDocumentResponse>> {
  const response = await axiosClient.post<BaseResponse>(
    "/articles/get-or-add",
    request,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    }
  )
  return response.data
}

export async function createHighlight(
  request: CreateHighlightRequest,
  token: string
): Promise<BaseResponse<any>> {
  const response = await axiosClient.post<BaseResponse>(
    "/highlights",
    request,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    }
  )
  return response.data
}
