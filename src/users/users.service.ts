import { Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { formatResponse } from 'src/utils';
import { UsersRepository } from './users.repository';
import { isPasswordSame } from 'src/utils/auth';
import { generateJWT } from 'src/utils/auth';
import { env } from 'src/utils/env';
import { ProfileInput } from './dto/create-profile-input';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async signUp(createUserInput: CreateUserInput) {
    let userResultObj = await this.usersRepository.findUserByEmail(
      createUserInput.email,
    );

    if (userResultObj.records.length > 0) {
      throw new Error(
        `User with email ${createUserInput.email} already exists`,
      );
    }

    userResultObj = await this.usersRepository.findUserByPhone(
      createUserInput.phone,
    );

    if (userResultObj.records.length > 0) {
      throw new Error(
        `User with phone number ${createUserInput.phone} already exists`,
      );
    }
    const resultObj = await this.usersRepository.create(createUserInput);
    const user = formatResponse(resultObj)[0];
    return {
      ...user,
      authorization: generateJWT(
        { use: 'user', id: user.id },
        Number(env('JWT_TOKEN_EXPIRY_IN_SECONDS', false) || 40000),
      ),
    };
  }

  async logIn(email: string, password: string) {
    const userResultObj = await this.usersRepository.findUserByEmail(email);
    if (userResultObj.records.length === 0) {
      throw new Error(`User with email ${email} does not exist`);
    }
    const user = formatResponse(userResultObj)[0];
    if (!isPasswordSame(password, user.password)) {
      throw new Error(`Invalid password`);
    }
    return {
      ...user,
      authorization: generateJWT(
        { use: 'user', id: user.id },
        Number(env('JWT_TOKEN_EXPIRY_IN_SECONDS', false) || 40000),
      ),
    };
  }

  async createProfile(userId: string, profile: ProfileInput) {
    const userResultObj = await this.usersRepository.findOne(userId);
    if (userResultObj.records.length === 0) {
      throw new Error(`User with id ${userId} does not exist`);
    }
    const user = formatResponse(userResultObj)[0];
    const resultObj = await this.usersRepository.createProfile(userId, profile);
    const userProfile = formatResponse(resultObj.profileResultObj)[0];

    const workExperience = (
      await Promise.all([...resultObj.workExperience])
    ).map((workExperience) => {
      return formatResponse(workExperience)[0];
    });

    const education = (await Promise.all([...resultObj.education])).map(
      (education) => {
        return formatResponse(education)[0];
      },
    );

    const projects = (await Promise.all([...resultObj.projects])).map(
      (project) => {
        return formatResponse(project)[0];
      },
    );
    return {
      ...user,
      ...userProfile,
      workExperience,
      education,
      projects,
    };
  }

  async findAll() {
    const resultObj = await this.usersRepository.findAll();
    return formatResponse(resultObj);
  }

  async findOne(id: string) {
    const resultObj = await this.usersRepository.findOne(id);
    return formatResponse(resultObj)[0];
  }

  findUserProfile(userId: string) {
    return `This action returns a user profile`;
  }

  update(id: string, updateUserInput: UpdateUserInput) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
