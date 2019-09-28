import { Test, TestingModule } from '@nestjs/testing';
import { BidsController } from './bids.controller';

describe('Bids Controller', () => {
  let controller: BidsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BidsController],
    }).compile();

    controller = module.get<BidsController>(BidsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
