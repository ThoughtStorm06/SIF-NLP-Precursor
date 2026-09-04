import httpx


API_URL = "http://127.0.0.1:8000/api/v1/analyze"


def send_report(file_type: str, content: str):
    payload = {
        "file_type": file_type,
        "content": content,
    }

    try:
        response = httpx.post(
            API_URL,
            json=payload,
            timeout=10.0,
        )

        response.raise_for_status()

        return response.json()

    except httpx.TimeoutException:
        print("Error: Request to server timed out.")

    except httpx.ConnectError:
        print("Error: Could not connect to FastAPI server.")

    except httpx.HTTPStatusError as e:
        print(
            f"Error: Server returned HTTP {e.response.status_code}: "
            f"{e.response.text}"
        )

    except httpx.RequestError as e:
        print(f"Error: HTTP request failed: {e}")

    except ValueError:
        print("Error: Server returned invalid JSON.")

    except Exception as e:
        print(f"Unexpected client error: {e}")

    return None


def main():
    content = input("Enter safety report: ")

    result = send_report(
        file_type="txt",
        content=content,
    )

    if result is not None:
        print("\nServer response:")
        print(result)


if __name__ == "__main__":
    main()