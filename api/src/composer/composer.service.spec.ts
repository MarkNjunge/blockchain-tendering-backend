import { Test, TestingModule } from "@nestjs/testing";
import { ComposerService } from "./composer.service";

describe("ComposerService", () => {
  let service: ComposerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComposerService],
    }).compile();

    service = module.get<ComposerService>(ComposerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
