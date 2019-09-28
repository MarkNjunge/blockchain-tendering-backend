import { Test, TestingModule } from "@nestjs/testing";
import { NoticesController } from "./notices.controller";

describe("Notices Controller", () => {
  let controller: NoticesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoticesController],
    }).compile();

    controller = module.get<NoticesController>(NoticesController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
