import axiosClient from "./axios-client"
import type { BaseResponse } from "./types/api-result"
import type {
  GetOrAddDocumentRequest,
  GetOrAddDocumentResponse
} from "./types/article"

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
