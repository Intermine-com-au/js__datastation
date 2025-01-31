import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

import { RPC_ASYNC_REQUEST, RPC_ASYNC_RESPONSE } from '../shared/constants';

let messageNumber = -1;

contextBridge.exposeInMainWorld('asyncRPC', async function <
  Request,
  Args,
  Response
>(resource: string, args?: Args, body?: Request) {
  const payload = {
    // Assign a new message number
    messageNumber: ++messageNumber,
    resource,
    args,
    body,
  };
  ipcRenderer.send(RPC_ASYNC_REQUEST, payload);

  const result = await new Promise<{
    isError: boolean;
    body: Response | string;
  }>((resolve, reject) => {
    ipcRenderer.once(
      `${RPC_ASYNC_RESPONSE}:${payload.messageNumber}`,
      (
        e: IpcRendererEvent,
        response: { isError: boolean; body: Response | string }
      ) => resolve(response)
    );
  });

  if (result.isError) {
    throw result.body;
  }

  return result.body;
});
