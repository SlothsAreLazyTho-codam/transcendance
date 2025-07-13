import { json } from "stream/consumers";

export type FetchClientOptions = {
  baseUrl: string;
  headers?: any;
};

export type Request = {
  headers?: any;
  body?: any;
};

class FetchClient {
  private options: FetchClientOptions;

  public readonly protocol: string;
  public readonly host: string;
  public readonly isSSL: boolean;

  constructor(options: FetchClientOptions) {
    if (!options.baseUrl.startsWith("http")) {
      options.baseUrl = `https://${options.baseUrl}`;
    }

    const url = new URL(options.baseUrl);

    this.options = options;
    this.protocol = url.protocol;
    this.host = url.host;
    this.isSSL = url.protocol.startsWith("https");
  }

  private getUrl(path: string): string {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }

    return path;
  }

  async put(url: string, request: Request): Promise<Response> {
    request.headers = {
      ...request.headers,
      ...this.options.headers,
    };

    return fetch(`${this.options.baseUrl}${this.getUrl(url)}`, {
      headers: request.headers,
      body: request.body,
      method: "PUT",
    });
  }

  /**
   * Sends a PUT request with a JSON-encoded body to the specified URL.
   *
   * @param url - The endpoint path to send the request to, relative to the base URL.
   * @param body - The payload to be sent as the JSON body of the request.
   * @param request - An object containing request options, including headers.
   * @returns A promise that resolves to the response of the fetch request.
   */
  async putJSON(url: string, body: any, request: Request): Promise<Response> {
    request.headers = {
      ...request.headers,
      ...this.options.headers,
      "Content-Type": "application/json",
    };

    return fetch(`${this.options.baseUrl}${this.getUrl(url)}`, {
      headers: request.headers,
      body: JSON.stringify(body),
      method: "PUT",
    });
  }

  /**
   * Sends a POST request to the specified URL with the provided request options.
   *
   * @param url - The endpoint to which the POST request will be sent. This is appended to the base URL.
   * @param request - The request object containing headers and other options for the POST request.
   * @returns A Promise that resolves to the Response object returned by the fetch API.
   *
   * @remarks
   * - The method merges headers from the provided request object and the default headers defined in `this.options.headers`.
   * - The `baseUrl` from `this.options` is prepended to the given URL.
   * - The HTTP method used is "POST".
   */
  async post(url: string, request: Request): Promise<Response> {
    request.headers = {
      ...request.headers,
      ...this.options.headers,
    };

    return fetch(`${this.options.baseUrl}${this.getUrl(url)}`, {
      headers: request.headers,
      body: request.body,
      method: "POST",
    });
  }

  /**
   * Sends a POST request with a JSON payload to the specified URL.
   *
   * @param url - The endpoint URL to which the request will be sent.
   * @param request - The request object containing headers and body data.
   * @returns A promise that resolves to the server's response.
   *
   * @remarks
   * - The `request.headers` will be merged with the default headers specified in `this.options.headers`.
   * - The `request.body` will be serialized to a JSON string before being sent.
   * - The `baseUrl` from `this.options` will be prepended to the provided `url`.
   */
  async postJSON(url: string, data: any, request: Request): Promise<Response> {
    request.headers = {
      ...request.headers,
      ...this.options.headers,
      "Content-Type": "application/json",
    };

    return fetch(`${this.options.baseUrl}${this.getUrl(url)}`, {
      headers: request.headers,
      body: JSON.stringify(data),
      method: "POST",
    });
  }

  /**
   * Sends a GET request to the specified URL with the provided request options.
   *
   * @param url - The endpoint to send the GET request to, relative to the base URL.
   * @param request - The request object containing headers and other options.
   * @returns A Promise that resolves to the Response object from the fetch call.
   */
  async get(url: string, request: Request): Promise<Response> {
    return fetch(`${this.options.baseUrl}${this.getUrl(url)}`, {
      headers: {
        ...request.headers,
        ...this.options.headers,
      },
      method: "GET",
    });
  }

  /**
   * Sends an HTTP DELETE request to the specified URL with the provided request options.
   *
   * @param url - The endpoint URL (relative to the base URL) to which the DELETE request will be sent.
   * @param request - An object containing request options such as headers and body.
   * @returns A promise that resolves to the response of the fetch call.
   */
  async delete(url: string, request: Request): Promise<Response> {
    request.headers = {
      ...request.headers,
      ...this.options.headers,
    };

    return fetch(`${this.options.baseUrl}${this.getUrl(url)}`, {
      headers: request.headers,
      body: request.body,
      method: "DELETE",
    });
  }

  /**
   * Sends a GET request to the specified URL and returns the response data as the specified type.
   *
   * @template T - The type to which the response data should be cast.
   * @param {string} url - The endpoint URL to send the GET request to.
   * @param {Request} request - The request object containing headers and other configurations.
   * @returns {Promise<T | undefined>} - A promise that resolves to the response data cast as type T,
   * or `undefined` if the request fails or the response is not OK.
   */
  async getAs<T>(url: string, request: Request): Promise<T | undefined> {
    try {
      const response = await fetch(
        `${this.options.baseUrl}${this.getUrl(url)}`,
        {
          headers: {
            ...request.headers,
            ...this.options.headers,
            "Content-Type": "application/json",
          },
          method: "GET",
        }
      );

      if (!response.ok) {
        return undefined;
      }

      return response.json().then((x) => x as T);
    } catch (ex) {
      console.error(
        `[FetchClient]<getAs> Error fetching data from ${url}:`,
        ex
      );
      return undefined;
    }
  }

  /**
   * Sends a GET request to the specified URL and returns the response data as the specified type.
   *
   * @template T - The type to which the response data should be cast.
   * @param {string} url - The endpoint URL to send the GET request to.
   * @param {Request} request - The request object containing headers and other configurations.
   * @returns {Promise<T | undefined>} - A promise that resolves to the response data cast as type T,
   * or `undefined` if the request fails or the response is not OK.
   */
  async getArrayAs<T>(url: string, request: Request): Promise<T[]> {
    try {
      const response = await fetch(
        `${this.options.baseUrl}${this.getUrl(url)}`,
        {
          headers: {
            ...request.headers,
            ...this.options.headers,
            "Content-Type": "application/json",
          },
          method: "GET",
        }
      );

      if (!response.ok) {
        return [];
      }

      return response.json().then((x) => x as T[]);
    } catch {
      return [];
    }
  }
}

export const newFetchClient = (url: string, token?: string) =>
  new FetchClient({
    baseUrl: url,
    headers: {
      authorization: token ? `bearer ${token}` : null,
    },
  });

export default FetchClient;
