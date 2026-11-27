import axiosClient from "./axios-client"
import type { BaseResponse } from "./types/api-result"
import type {
  GetOrAddDocumentRequest,
  GetOrAddDocumentResponse
} from "./types/article"
import type { CreateHighlightRequest } from "./types/highlight"

export async function getOrAddDocument(
  request: GetOrAddDocumentRequest
): Promise<BaseResponse<GetOrAddDocumentResponse>> {
  const response = await axiosClient.post<BaseResponse>(
    "/articles/get-or-add",
    request,
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  )
  return response.data
}

export async function createHighlight(
  request: CreateHighlightRequest
): Promise<BaseResponse<any>> {
  const response = await axiosClient.post<BaseResponse>(
    "/highlights",
    request,
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  )
  return response.data
}

export async function deleteHighlight(
  highlightId: string,
  updateAt: number
): Promise<BaseResponse<any>> {
  const response = await axiosClient.delete<BaseResponse>(
    `/highlights/${highlightId}/${updateAt}`,
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  )
  return response.data
}
