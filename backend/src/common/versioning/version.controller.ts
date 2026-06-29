import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class VersionController {
  @Get('version')
  getVersion() {
    return {
      current_version: '1',
      supported_versions: ['1'],
      deprecated_versions: [],
      documentation: '/api/docs',
      changelog: 'https://github.com/amank9115/AutiSense-AI/blob/main/docs/API_CHANGELOG.md',
    };
  }
}
