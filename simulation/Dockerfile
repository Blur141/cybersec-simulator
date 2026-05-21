FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir flask flask-cors requests psutil
COPY . .
EXPOSE 5000
CMD ["python", "attack_simulator.py"]
