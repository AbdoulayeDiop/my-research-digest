# Contributing to My Research Digest

First off, thank you for considering contributing to My Research Digest! It's people like you that make open source such a great community.

We welcome any type of contribution, not just code. You can help with:
-   **Reporting a bug**
-   **Discussing the current state of the code**
-   **Submitting a fix**
-   **Proposing new features**
-   **Becoming a maintainer**

## Getting Started

### Development Environment

The development environment for My Research Digest is fully containerized using Docker. To get started, you'll need to have [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine.

1.  **Fork and Clone the Repository**

    ```bash
    git clone https://github.com/YOUR_USERNAME/my-research-digest.git
    cd my-research-digest
    ```

2.  **Create your Environment File**

    Create a `.development.env` file in the root of the project by copying the example file:

    ```bash
    cp backend-python/.env.example .development.env
    ```

    Now, open `.development.env` and fill in the required environment variables. You will need to set up an [Auth0](https://auth0.com/) application and an [OpenAI](https://openai.com/) account to get the necessary keys. The other variables can be left as they are for local development.

3.  **Launch the Application**

    Run the following command to build and start all the services:

    ```bash
    docker-compose -f docker-compose-dev.yml up --build
    ```

    The application should now be running:
    -   The frontend will be accessible at `http://localhost`.
    -   The Node.js backend API will be at `http://localhost/api`.

### Making Changes

1.  **Create a New Branch**

    Create a new branch for your changes. Use a descriptive name.

    ```bash
    git checkout -b feature/my-awesome-feature
    ```

2.  **Code Style**

    Please adhere to the existing code style.
    -   **Frontend**: The frontend uses Prettier for code formatting. Consider installing a Prettier extension in your editor to format the code on save.
    -   **Backend (Python)**: Follow the [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide.

3.  **Running Tests**

    -   **Frontend**: There are currently no tests for the frontend. However, you should run the linter to check for any issues:
        ```bash
        docker-compose -f docker-compose-dev.yml exec frontend npm run lint
        ```

    -   **Node.js Backend**: There are no tests for the Node.js backend at the moment.

    -   **Python Backend**: The Python backend has a suite of tests. To run them, you'll need to have `pytest` installed.
        ```bash
        # First, shell into the running backend-python container
        docker-compose -f docker-compose-dev.yml exec backend-python /bin/bash

        # Then, install pytest and run the tests
        pip install pytest
        pytest
        ```

### Submitting Your Contribution

1.  **Commit and Push**

    Once your changes are ready, commit them with a clear commit message and push the branch to your fork.

    ```bash
    git commit -m "feat: Add my awesome feature"
    git push origin feature/my-awesome-feature
    ```

2.  **Create a Pull Request**

    Go to the original repository on GitHub and create a new pull request. Provide a clear description of your changes and why you are making them.

## Code of Conduct

This project and everyone participating in it is governed by the [My Research Digest Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

## Questions?

If you have any questions, feel free to open an issue on GitHub.
