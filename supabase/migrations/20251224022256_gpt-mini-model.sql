INSERT INTO
    ai_pricing (
        model,
        state,
        input_price_per_token,
        output_price_per_token,
        cached_input_price_per_token
    )
VALUES
    (
        'openai/gpt-5-mini',
        'active',
        0.00000025,
        0.000002,
        0.00000003
    );