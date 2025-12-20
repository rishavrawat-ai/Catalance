export const validateResource = (schema) => (req, _res, next) => {
  try {
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query
    });
    next();
  } catch (error) {
    next(error);
  }
};
