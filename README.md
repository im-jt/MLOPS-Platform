# Notebook IDE - Jupyter Backend Setup Guide

This document explains how to set up and run the necessary Jupyter backend server to enable Python code execution within the Notebook IDE application.

## Overview

The Notebook IDE relies on a local Jupyter server to execute code written in `code` cells. The frontend application communicates with this server via HTTP and WebSockets. To ensure this communication works, you need to have a Jupyter server running on your local machine with specific settings.

## Prerequisites

Before you begin, make sure you have the following installed:

1.  **Python**: Version 3.8 or higher is recommended. You can download it from [python.org](https://www.python.org/).
2.  **JupyterLab**: This is the next-generation web-based user interface for Project Jupyter. It's the recommended way to run the Jupyter server.

You can install JupyterLab using `pip`, the Python package installer. It's also a good practice to install `ipykernel`, which is the kernel for running Python code.

Open your terminal or command prompt and run:

```bash
pip install jupyterlab ipykernel
```

## Running the Jupyter Server

To start the Jupyter server with the correct configuration for this application, follow these steps:

1.  **Open your terminal or command prompt.**

2.  **Navigate to the directory where you want your notebooks to be saved (optional).**

3.  **Run the following command:**

    ```bash
    jupyter lab --ServerApp.allow_origin='*' --no-browser
    ```

### Command Breakdown

-   `jupyter lab`: This is the standard command to start the JupyterLab server.
-   `--ServerApp.allow_origin='*'`: This is a **critical** setting. It configures Cross-Origin Resource Sharing (CORS) to allow requests from any origin. The Notebook IDE frontend runs on a different origin than the Jupyter server (`localhost:8888`), so this flag is necessary for the browser to permit the connection.
    -   **Note on Security**: For local development, using `*` is convenient. In a production environment, you would replace `*` with the specific domain where your frontend is hosted (e.g., `--ServerApp.allow_origin='https://my-notebook-app.com'`).
-   `--no-browser`: This prevents Jupyter from automatically opening its own interface in a new browser tab. Since we are using the Notebook IDE as the frontend, this is not needed.

Once you run the command, you should see output in your terminal indicating that the Jupyter server is running and listening for connections, typically on `http://localhost:8888/`. Keep this terminal window open while you are using the Notebook IDE.

## Verification

After starting the Jupyter server:

1.  **Open the Notebook IDE application.**
2.  In the top-right header of the app, you should see the status **"Kernel: Running"**.
3.  Try adding a code cell (e.g., `print("Hello from Jupyter!")`) and running it (using the play button or `Ctrl+Enter`).
4.  If the setup is correct, you should see the output "Hello from Jupyter!" appear below the cell.

## Troubleshooting

-   **Connection Errors / CORS Errors**: If the app cannot connect to the kernel, check the browser's developer console (F12) for errors. If you see a CORS-related error, ensure you have included the `--ServerApp.allow_origin='*'` flag when starting the Jupyter server.

-   **Server Not Found**: Make sure the Jupyter server is running and that you see the "Jupyter Server is running at:" message in your terminal. Ensure no other application or firewall is blocking port `8888`.

-   **Python Environment**: If your code imports libraries that are not found, make sure those libraries are installed in the Python environment that your Jupyter kernel is using. You can install them via `pip`, for example: `pip install pandas numpy`.
