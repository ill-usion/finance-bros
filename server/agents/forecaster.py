import numpy as np
from timesfm import TimesFM_2p5_200M_torch, ForecastConfig

MIN_FORECAST_DAYS = 28

model = TimesFM_2p5_200M_torch.from_pretrained("google/timesfm-2.5-200m-pytorch")
model.compile(
    ForecastConfig(
        max_context=1024,
        max_horizon=256,
        normalize_inputs=True,
        infer_is_positive=True,
    )
)

def predict_spendings(spendings: list[float], horizon: int = 7) -> list[float]:
    """
    Predict the next 7 days of spendings based on the past spendings.

    Args:
        spendings (list[float]): A list of past month of spendings.
        horizon (int): The number of days to forecast.

    Returns:
        list[float]: A list of predicted spendings for the next 7 days.
    """
    if len(spendings) < MIN_FORECAST_DAYS:
        raise ValueError(f"At least {MIN_FORECAST_DAYS} days of spendings are required for prediction.")

    input_data = np.array(spendings)

    point_fc, quantile_fc = model.forecast(inputs=[input_data], horizon=horizon)

    return point_fc[0].tolist()


if __name__ == "__main__":
    past_spendings = [
        12.50, 45.00, 0.00, 8.20, 15.30, 22.00, 110.45, 
        14.20, 35.10, 5.00, 0.00, 18.90, 24.50, 95.00,
        9.10,  42.00, 0.00, 7.30, 12.10, 31.00, 150.20,
        11.40, 28.50, 6.20, 0.00, 19.30, 21.00, 88.10,
        13.00, 40.00
    ]
    predicted_spendings = predict_spendings(past_spendings)
    print("Predicted spendings for the next week:", predicted_spendings)