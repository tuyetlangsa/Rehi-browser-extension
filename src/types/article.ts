export interface GetOrAddDocumentRequest {
  id: string
  url: string
  rawHtml: string
}

export interface GetOrAddDocumentResponse {
  id: string
  url: string
  isSavedBefore: boolean
}


