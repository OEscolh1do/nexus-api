const jwt = require('jsonwebtoken');

// validateM2M usa fetch e process.env — mocks antes do require
let _validateM2M;

const mockNext = jest.fn();
const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
};

function makeReq(overrides = {}) {
  return { headers: {}, ...overrides };
}

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  // Reset env
  delete process.env.LOGTO_ENDPOINT;
  delete process.env.LOGTO_M2M_RESOURCE;
  delete process.env.M2M_SERVICE_TOKEN;
});

describe('validateM2M — legacy token', () => {
  beforeEach(() => {
    process.env.M2M_SERVICE_TOKEN = 'secret-legacy';
    _validateM2M = require('../middleware/validateM2M');
  });

  test('aceita X-Service-Token válido', async () => {
    const req = makeReq({ headers: { 'x-service-token': 'secret-legacy' } });
    await _validateM2M(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test('rejeita X-Service-Token incorreto', async () => {
    const req = makeReq({ headers: { 'x-service-token': 'wrong-secret' } });
    await _validateM2M(req, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  test('rejeita request sem credenciais', async () => {
    const req = makeReq();
    await _validateM2M(req, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing M2M credentials' });
  });
});

describe('validateM2M — Bearer token (caminho de erro JWKS)', () => {
  beforeEach(() => {
    // Simula JWKS indisponível (sem endpoint configurado)
    delete process.env.LOGTO_ENDPOINT;
    _validateM2M = require('../middleware/validateM2M');
  });

  test('rejeita Bearer token quando JWKS indisponível', async () => {
    const fakeToken = jwt.sign({ sub: 'test' }, 'secret', { algorithm: 'HS256' });
    const req = makeReq({ headers: { authorization: `Bearer ${fakeToken}` } });
    await _validateM2M(req, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid M2M token' });
  });
});
